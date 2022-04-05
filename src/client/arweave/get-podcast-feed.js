/* eslint-disable no-await-in-loop */
import client from './client';
import { isEmpty, toDate } from '../../utils';
import {
  toTag, fromTag, mergeBatchMetadata, mergeBatchTags,
} from './utils';

const MAX_BATCH_NUMBER = 100;

export default async function getPodcastFeed(subscribeUrl) {
  const metadataBatches = [];
  const tagBatches = [];
  // TODO: negative batch numbers
  let batch = 0;
  do {
    // console.log(`getPodcastFeedForBatch(${subscribeUrl}, ${batch})`);
    const [metadata, tags] = await getPodcastFeedForBatch(subscribeUrl, batch);
    // console.log('metadata=', metadata);
    // console.log('tags=', tags);
    if (!isEmpty(tags)) {
      if (isEmpty(metadata)) {
        // Match found for this batch number, but with invalid metadata
        // TODO: prioritize next trx.id with this batch number;
        //       for now, we continue to attempt the next batch number
      }
      else {
        metadataBatches.push(metadata);
        tagBatches.push(tags);
      }
    }
    else break;

    batch++;
  }
  while (batch < MAX_BATCH_NUMBER);

  return { ...mergeBatchMetadata(metadataBatches), ...mergeBatchTags(tagBatches) };
}

async function getPodcastFeedForBatch(subscribeUrl, batch) {
  const gqlQuery = {
    query: `
      query GetPodcast($tags: [TagFilter!]!) {
        transactions(tags: $tags, first: 100, sort: HEIGHT_DESC) {
          edges {
            node {
              id
              tags {
                name
                value
              }
            }
          }
        }
      }
    `,
    variables: {
      tags: [
        {
          name: toTag('subscribeUrl'),
          values: [subscribeUrl],
        },
        {
          name: toTag('metadataBatch'),
          // Here we could get multiple batches at the same time, but fetching one at a time
          // allows us to select the best metadata from many (partial) copies of the same batch,
          // without quickly exceeding the 100 transaction limit of the GraphQL response.
          values: [`${batch}`],
        },
      ],
    },
  };

  let edges;
  try {
    const response = await client.api.post('/graphql', gqlQuery);
    console.log('GraphQL response', response);
    edges = response.data.data.transactions.edges;
  }
  catch (e) {
    console.warn(`GraphQL returned an error: ${e}`);
    edges = [];
  }
  // console.log('edges', edges);
  if (!edges.length) return [{}, {}];

  // TODO: We currently simply grab the newest transaction matching this `batch` nr.
  //       In the future we might want to fetch multiple transactions referencing
  //       the same batch and merge the result.
  const trx = edges[0].node;
  let podcastMetadata;
  let tags;
  try {
    tags = trx.tags
      .filter(tag => !['Content-Type', 'Unix-Time', toTag('version')].includes(tag.name))
      .map(tag => ({
        ...tag,
        name: fromTag(tag.name),
        value: ['firstEpisodeDate', 'lastEpisodeDate'].includes(fromTag(tag.name)) ?
          toDate(tag.value) : tag.value,
      }))
      .reduce((acc, tag) => ({
        ...acc,
        [tag.name]: Array.isArray(acc[tag.name]) ? acc[tag.name].concat(tag.value) : tag.value,
      }), {
        categories: [],
        keywords: [],
      });

    // TODO: Create localStorage cache { trx.id: { podcastMetadata, trx.tags } } for
    //       transactions that are selected for the result of getPodcastFeed(),
    //       so that we may skip this client.transactions.getData() call.
    podcastMetadata = await client.transactions.getData(trx.id, {
      decode: true,
      string: true,
    }).then(JSON.parse);
  }
  catch (e) {
    console.warn(`Malformed data for transaction id ${trx.id}: ${e}`);
    podcastMetadata = {};
  }
  if (isEmpty(podcastMetadata)) return [{}, tags];

  return [
    {
      ...podcastMetadata,
      episodes: (podcastMetadata.episodes || []).map(episode => ({
        ...episode,
        // TODO: Safeguard against malformed metadata => reject episodes where publishedAt == null
        publishedAt: toDate(episode.publishedAt),
      })).sort((a, b) => b.publishedAt - a.publishedAt),
    },
    tags,
  ];
}
