import gql from 'fake-tag';
import client from './client';
import { toTag, fromTag } from './utils';
import { isEmpty } from '../../utils';

export default async function getPodcastFeed(subscribeUrl) {
  const gqlTagFilter = `
    [{name: "${toTag('subscribeUrl')}",
      values: ["${subscribeUrl}"]}]
  `
  const gqlQuery = {
    query: `
      query {
        transactions(tags: ${gqlTagFilter}, first: 100, sort: HEIGHT_DESC) {
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
    `
  }

  const edges = await client.api.post('/graphql', gqlQuery).then(res => {
    console.log('GraphQL response', res);
    if (res.status >= 400)
      return [];

    return res.data.data.transactions.edges;
  });

  console.log('edges', edges);
  if (isEmpty(edges))
    return {};

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
