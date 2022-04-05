import getPodcastFeed from '../get-podcast-feed';
// eslint-disable-next-line import/named
import { transactions, api } from '../client';

jest.mock('../client');

const TAG_EXCLUDES = ['Content-Type', 'Unix-Time'];

function toTag(name) {
  return TAG_EXCLUDES.includes(name) ? name : `${process.env.TAG_PREFIX}-${name}`;
}

function emptyGqlResponse() {
  return {
    data: {
      data: {
        transactions: {
          edges: [],
        },
      },
    },
  };
}

function gqlResponse(metadataBatch, firstEpisodeDate, lastEpisodeDate) {
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
                { name: 'metadataBatch', value: `${metadataBatch}` },
                { name: 'firstEpisodeDate', value: firstEpisodeDate },
                { name: 'lastEpisodeDate', value: lastEpisodeDate },
              ].map(tag => ({ ...tag, name: toTag(tag.name) })),
            },
          }],
        },
      },
    },
  };
}

const ep4date = '2021-11-10T15:06:18.000Z';
const ep3date = '2021-11-09T15:06:18.000Z';
const ep2date = '2021-11-08T05:00:00.000Z';
const ep1date = '2021-11-08T04:00:00.000Z';

const episodes = [
  {
    title: 'Ep4',
    url: 'https://server.dummy/ep4',
    publishedAt: ep4date,
  },
  {
    title: 'Ep3',
    url: 'https://server.dummy/ep3',
    publishedAt: ep3date,
  },
  {
    title: 'Ep2',
    url: 'https://server.dummy/ep2',
    publishedAt: ep2date,
  },
  {
    title: 'Ep1',
    url: 'https://server.dummy/ep1',
    publishedAt: ep1date,
  },
];

function mergedBatchesResult(metadataBatch, firstEpisodeDate, lastEpisodeDate) {
  return {
    subscribeUrl: 'https://server.dummy/rss',
    title: 'That Podcast',
    description: 'The best of That Podcast',
    categories: ['PoLitics', 'CaTs'],
    keywords: ['comedY', 'Comedy'],
    episodes: episodes.map(ep => ({ ...ep, publishedAt: new Date(ep.publishedAt) })),
    metadataBatch,
    firstEpisodeDate: new Date(firstEpisodeDate),
    lastEpisodeDate: new Date(lastEpisodeDate),
  };
}

function getDataJson(firstEpisodeIndex, numEpisodes) {
  return JSON.stringify({
    episodes: episodes.slice(firstEpisodeIndex, firstEpisodeIndex + numEpisodes),
  });
}

const originalTagPrefix = process.env.TAG_PREFIX;
beforeAll(() => {
  process.env.TAG_PREFIX = 'bestPrefix';
});

afterAll(() => {
  process.env.TAG_PREFIX = originalTagPrefix;
});

describe('Successful fetch', () => {
  describe('With 1 metadata batch', () => {
    it('returns the expected merged metadata and tags', async () => {
      api.post.mockResolvedValueOnce(gqlResponse(0, ep1date, ep4date));
      api.post.mockResolvedValueOnce(emptyGqlResponse());
      transactions.getData.mockResolvedValueOnce(getDataJson(0, 4));
      expect(transactions.getData).not.toHaveBeenCalled();

      await expect(getPodcastFeed('https://server.dummy/rss'))
        .resolves.toEqual(mergedBatchesResult(0, ep1date, ep4date));
      expect(transactions.getData).toHaveBeenCalledWith('mockId', {
        decode: true,
        string: true,
      });
    });
  });

  describe('With 2 metadata batches', () => {
    it('returns the expected merged metadata and tags', async () => {
      api.post.mockResolvedValueOnce(gqlResponse(0, ep1date, ep2date));
      transactions.getData.mockResolvedValueOnce(getDataJson(2, 2));

      api.post.mockResolvedValueOnce(gqlResponse(1, ep3date, ep4date));
      transactions.getData.mockResolvedValueOnce(getDataJson(0, 2));

      api.post.mockResolvedValueOnce(emptyGqlResponse());

      await expect(getPodcastFeed('https://server.dummy/rss'))
        .resolves.toEqual(mergedBatchesResult(1, ep1date, ep4date));
      expect(transactions.getData).toHaveBeenCalledWith('mockId', {
        decode: true,
        string: true,
      });
    });
  });

  describe('With 3 metadata batches', () => {
    it('returns the expected merged metadata and tags', async () => {
      // oldest episode
      api.post.mockResolvedValueOnce(gqlResponse(0, ep1date, ep1date));
      transactions.getData.mockResolvedValueOnce(getDataJson(3, 1));

      // oldest 2 episodes (including 1 duplicate)
      api.post.mockResolvedValueOnce(gqlResponse(1, ep1date, ep2date));
      transactions.getData.mockResolvedValueOnce(getDataJson(2, 2));

      // newest 2 episodes
      api.post.mockResolvedValueOnce(gqlResponse(2, ep3date, ep4date));
      transactions.getData.mockResolvedValueOnce(getDataJson(0, 2));

      api.post.mockResolvedValueOnce(emptyGqlResponse());

      await expect(getPodcastFeed('https://server.dummy/rss'))
        .resolves.toEqual(mergedBatchesResult(2, ep1date, ep4date));
      expect(transactions.getData).toHaveBeenCalledWith('mockId', {
        decode: true,
        string: true,
      });
    });
  });
});

describe('Error handling', () => {
  describe('With 3 metadata batches, where the middle one is corrupted', () => {
    it('returns the expected merged metadata and tags', async () => {
      const mockError = new Error('getData Error');

      api.post.mockResolvedValueOnce(gqlResponse(0, ep1date, ep2date));
      transactions.getData.mockResolvedValueOnce(getDataJson(2, 2));

      api.post.mockResolvedValueOnce(gqlResponse(1, ep1date, ep2date));
      transactions.getData.mockRejectedValueOnce(mockError);

      api.post.mockResolvedValueOnce(gqlResponse(2, ep3date, ep4date));
      transactions.getData.mockResolvedValueOnce(getDataJson(0, 2));

      api.post.mockResolvedValueOnce(emptyGqlResponse());

      await expect(getPodcastFeed('https://server.dummy/rss'))
        .resolves.toEqual(mergedBatchesResult(2, ep1date, ep4date));
      expect(transactions.getData).toHaveBeenCalledWith('mockId', {
        decode: true,
        string: true,
      });
    });
  });

  it('catches GraphQL request error and returns {}', async () => {
    const mockError = new Error('GraphQL Error');
    api.post.mockRejectedValue(mockError);
    transactions.getData.mockResolvedValue(getDataJson(0, 4));
    await expect(getPodcastFeed('https://server.dummy/rss')).resolves.toEqual({});
    expect(api.post).toHaveBeenCalled();
    expect(transactions.getData).not.toHaveBeenCalled();
  });
});
