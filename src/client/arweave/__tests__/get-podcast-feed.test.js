import getPodcastFeed from '../get-podcast-feed';
import { transactions, api } from '../client';

jest.mock('../client');

function baseGqlResponse() {
  return {
    data: {
      data: {
        transactions: {
          edges: [{
            node: {
              id: 'mockId',
              tags: [
                { name: 'Content-Type', value: 'application/json' },
                { name: 'Unix-Time', value: '1620172800' },
                { name: 'version', value: 'bestVersion' },
                { name: 'subscribeUrl', value: 'https://server.dummy/rss' },
                { name: 'title', value: 'That Podcast' },
                { name: 'description', value: 'The best of That Podcast' },
                { name: 'keyword', value: 'comedY' },
                { name: 'keyword', value: 'Comedy' },
                { name: 'category', value: 'PoLitics' },
                { name: 'category', value: 'CaTs' },
              ]
                .map(tag => ({
                  ...tag,
                  name: `${process.env.TAG_PREFIX}-${tag.name}`,
                })),
            },
          }],
        },
      },
    },
  };
}

const BASE_TRANSACTION_RESPONSE = {
  episodes: [
    {
      imageUrl: 'https://server.dummy/img/steve-hoffman.jpg',
      publishedAt: new Date('2002-06-22'),
    },
    {
      imageUrl: 'https://server.dummy/img/steve-buchemi.bmp',
      publishedAt: new Date('1999-05-05'),
    },
  ],
};

const originalTagPrefix = process.env.TAG_PREFIX;
beforeAll(() => {
  process.env.TAG_PREFIX = 'bestPrefix';
});

afterAll(() => {
  process.env.TAG_PREFIX = originalTagPrefix;
});

test('Successful fetch', async () => {
  api.post.mockResolvedValue(baseGqlResponse());
  transactions.getData.mockResolvedValue(JSON.stringify(BASE_TRANSACTION_RESPONSE));
  expect(transactions.getData).not.toHaveBeenCalled();
  await expect(getPodcastFeed('https://server.dummy/rss')).resolves.toEqual({
    subscribeUrl: 'https://server.dummy/rss',
    title: 'That Podcast',
    description: 'The best of That Podcast',
    categories: ['PoLitics', 'CaTs'],
    keywords: ['comedY', 'Comedy'],
    episodes: [
      {
        imageUrl: 'https://server.dummy/img/steve-hoffman.jpg',
        publishedAt: new Date('2002-06-22'),
      },
      {
        imageUrl: 'https://server.dummy/img/steve-buchemi.bmp',
        publishedAt: new Date('1999-05-05'),
      },
    ],
  });
  expect(transactions.getData).toHaveBeenCalledWith('mockId', {
    decode: true,
    string: true,
  });
});

test('Fails on GraphQL request', async () => {
  const mockError = new Error('GraphQL Error');
  api.post.mockRejectedValue(mockError);
  transactions.getData.mockResolvedValue(JSON.stringify(BASE_TRANSACTION_RESPONSE));
  await expect(getPodcastFeed('https://server.dummy/rss')).rejects.toBe(mockError);
  expect(api.post).toHaveBeenCalled();
  expect(transactions.getData).not.toHaveBeenCalled();
});

test('Fails on getData request', async () => {
  const mockError = new Error('getData Error');
  api.post.mockResolvedValue(baseGqlResponse());
  transactions.getData.mockRejectedValue(mockError);
  await expect(getPodcastFeed('https://server.dummy/rss')).rejects.toBe(mockError);
  expect(api.post).toHaveBeenCalled();
  expect(transactions.getData).toHaveBeenCalled();
});
