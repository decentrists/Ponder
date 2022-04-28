/* eslint-disable no-await-in-loop */
import client from './client';
import {
  isNotEmpty,
  hasMetadata,
  toDate,
  podcastFromDTO,
  concatMessages,
  valueToLowerCase,
} from '../../utils';
import { toTag, fromTag } from './utils';
import { mergeBatchMetadata, mergeBatchTags } from './sync/diff-merge-logic';
import {
  PodcastFeedError,
  Podcast,
  PodcastTags,
  ALLOWED_ARWEAVE_TAGS,
} from '../interfaces';
// eslint-disable-next-line import/no-extraneous-dependencies
import { QueryTransactionsArgs, TagFilter } from 'arlocal/bin/graphql/types.d';

const MAX_BATCH_NUMBER = 100;
const MAX_GRAPHQL_NODES = 100;

interface TransactionNode { id: string, tags: { name: string, value: string }[] }

/** Type signature accepted by the Arweave API's '/graphql' endpoint */
type GraphQLQuery = {
  query: string,
  variables: QueryTransactionsArgs,
};
type AllowedArweaveTags = typeof ALLOWED_ARWEAVE_TAGS[number];
type TagsToFilter = {
  [key: string]: string | string[];
};

/** Helper function mapping each {tag: value, ...} to [{name: tag, values: value}, ...] */
const toTagFilter = (tagsToFilter: TagsToFilter) : TagFilter[] => {
  return Object.entries(tagsToFilter).map(([tag, value]) => ({
    name: toTag(tag),
    values: Array.isArray(value) ? value : [value],
  }));
};

export async function getPodcastFeed(subscribeUrl: Podcast['subscribeUrl']) :
Promise<Podcast | PodcastFeedError> {

  const errorMessages : string[] = [];
  const metadataBatches = [];
  const tagBatches : PodcastTags[] = [];
  // TODO: negative batch numbers
  let batch = 0;
  do {
    // console.debug(`getPodcastFeedForBatch(${subscribeUrl}, ${batch})`);
    const gqlQuery = formatGqlQueryForTags({ subscribeUrl, metadataBatch: `${batch}` });
    const { errorMessage, metadata, tags } = await getPodcastFeedForGqlQuery(gqlQuery);
    // console.debug('errorMessage=', errorMessage);
    // console.debug('metadata=', metadata);
    // console.debug('tags=', tags);
    if (errorMessage) errorMessages.push(errorMessage);

    if (isNotEmpty(tags)) {
      if (!hasMetadata(metadata)) {
        // Match found for this batch number, but with invalid/empty metadata
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

  const mergedMetadata : Partial<Podcast> =
    { ...mergeBatchMetadata(metadataBatches), ...mergeBatchTags(tagBatches) };
  if (!hasMetadata(mergedMetadata) && errorMessages.length) {
    // Only return an errorMessage if no metadata was found, since GraphQL likely was unreachable.
    return { errorMessage: `Encountered the following errors when fetching ${subscribeUrl} ` +
                           `metadata from Arweave:\n${concatMessages(errorMessages, true)}` };
  }

  return mergedMetadata as Podcast;
}

export async function getPodcastFeedForTxIds(ids: string[]) {
  // TODO: expand getPodcastFeedForGqlQuery to fetchData multiple nodes
  return getPodcastFeedForGqlQuery(formatGqlQueryForIds(ids));
}

type GetPodcastFeedForGqlQueryReturnType = {
  errorMessage?: string;
  metadata: Podcast | {};
  tags: PodcastTags | {};
};

async function getPodcastFeedForGqlQuery(gqlQuery: GraphQLQuery) :
Promise<GetPodcastFeedForGqlQueryReturnType> {

  let edges;
  let errorMessage;
  try {
    const response = await client.api.post('/graphql', gqlQuery);
    // console.debug('GraphQL response:', response);
    edges = response.data.data.transactions.edges;
  }
  catch (ex) {
    errorMessage = `GraphQL returned an error: ${ex}`;
    console.warn(errorMessage);
    edges = [];
  }
  // console.debug('GraphQL edges:', edges);
  if (errorMessage || !edges.length) return { errorMessage, metadata: {}, tags: {} };

  // TODO: We currently simply grab the newest transaction matching this `batch` nr.
  //       In the future we should fetch multiple transactions referencing the same batch and
  //       merge the result.
  const trx : TransactionNode = edges[0].node;
  let tags : Partial<PodcastTags> = {};
  if (isNotEmpty(trx.tags)) {
    tags = trx.tags
      .filter(tag => ALLOWED_ARWEAVE_TAGS.includes(fromTag(tag.name) as AllowedArweaveTags))
      .map(tag => ({
        ...tag,
        name: fromTag(tag.name),
        value: (['firstEpisodeDate', 'lastEpisodeDate', 'lastBuildDate'].includes(
          fromTag(tag.name)) ? toDate(tag.value) : tag.value),
      }))
      .reduce((acc, tag) => ({
        ...acc,
        [tag.name]: Array.isArray(acc[tag.name as keyof typeof acc])
          ? [...acc[tag.name as keyof typeof acc], valueToLowerCase(tag.value)]
          : tag.value,
      }), {
        categories: [],
        keywords: [],
        episodesKeywords: [],
      });
  }

  let getDataResult;
  try {
    // TODO: T252 Create localStorage cache { trx.id: { podcastMetadata, trx.tags } } for
    //       transactions that are selected for the result of getPodcastFeed(),
    //       so that we may skip this client.transactions.getData() call.
    getDataResult = await client.transactions.getData(trx.id, { decode: true, string: true });
  }
  catch (ex) {
    errorMessage = `Error fetching data for transaction id ${trx.id}: ${ex}`;
    console.warn(errorMessage);
  }
  if (errorMessage) return { errorMessage, metadata: {}, tags };

  let metadata;
  try {
    metadata = JSON.parse(getDataResult as string);
    metadata = podcastFromDTO(metadata, true);
  }
  catch (ex) {
    // TODO: T251 blacklist trx.id
    errorMessage = `Malformed data for transaction id ${trx.id}: ${ex}`;
    console.warn(errorMessage);
  }
  if (errorMessage) return { errorMessage, metadata: {}, tags };

  // TODO: T251 sanity check podcastMetadata => reject episodes where !isValidDate(publishedAt)
  return { metadata, tags };
}

/**
 * @param tagFilter
 * @returns An Object with the query formatted for Arweave's '/graphql' endpoint
 */
function formatGqlQueryForTags(tagsToFilter: TagsToFilter) : GraphQLQuery {
  const tags = toTagFilter(tagsToFilter);

  return {
    query: `
      query GetPodcast($tags: [TagFilter!]!) {
        transactions(tags: $tags, first: ${MAX_GRAPHQL_NODES}, sort: HEIGHT_DESC) {
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
    variables: { tags },
  };
}

/**
 * @param ids
 * @returns An Object with the query formatted for Arweave's '/graphql' endpoint
 */
function formatGqlQueryForIds(ids: string[]) : GraphQLQuery {
  return {
    query: `
      query GetPodcast($ids: [ID!]!) {
        transactions(ids: $ids, first: ${MAX_GRAPHQL_NODES}, sort: HEIGHT_DESC) {
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
    variables: { ids },
  };
}
