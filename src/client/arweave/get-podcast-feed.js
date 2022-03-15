import gql from 'fake-tag';
import client from './client';
import { toTag, fromTag } from './utils';

export default async function getPodcastFeed(subscribeUrl) {
  const transaction = await client.api.post('/graphql', {
    query: gql`
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
  })
    .then(res => res.data.data.transactions.edges[0]?.node);

  const podcast = await client.transactions.getData(transaction.id, {
    decode: true,
    string: true,
  })
    .then(JSON.parse);

  return {
    ...podcast,
    ...transaction.tags
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
