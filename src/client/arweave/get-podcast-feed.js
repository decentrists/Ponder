import client from './client';
import { toTag, fromTag } from './utils';
import { isEmpty } from '../../utils';

export default async function getPodcastFeed(subscribeUrl) {
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

  console.log('edges', edges);
  if (isEmpty(edges)) {
    return {};
  }

  const trx = edges[0].node;
  const podcast = await client.transactions.getData(trx.id, {
    decode: true,
    string: true,
  })
    .then(JSON.parse);

  return {
    ...podcast,
    ...trx.tags
      .map(tag => ({
        ...tag,
        name: fromTag(tag.name),
      }))
      .filter(tag => !['Content-Type', 'Unix-Time', 'version'].includes(tag.name))
      .reduce((acc, tag) => ({
        ...acc,
        [tag.name]: Array.isArray(acc[tag.name]) ? acc[tag.name].concat(tag.value) : tag.value,
      }), {
        categories: [],
        keywords: [],
      }),
    episodes: podcast.episodes.map(episode => ({
      ...episode,
      publishedAt: new Date(episode.publishedAt),
    })),
  };
}
