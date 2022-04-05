import { advanceTo } from 'jest-date-mock';
import { postPodcastMetadata } from '../create-transaction';
// eslint-disable-next-line import/named
import { addTag, createTransaction } from '../client';
// TODO: mock unixTimestamp()
import { unixTimestamp } from '../../../utils';
import { toTag } from '../utils';

jest.mock('../client');

const ep4date = '2021-11-10T15:06:18.000Z';
const ep3date = '2021-11-09T15:06:18.000Z';
const ep2date = '2021-11-08T05:00:00.000Z';
const ep1date = '2021-11-08T04:00:00.000Z';
const allEpisodes = [
  {
    title: 'Ep4',
    url: 'https://server.dummy/ep4',
    publishedAt: new Date(ep4date),
    categories: ['cat4'],
    keywords: [],
  },
  {
    title: 'Ep3',
    url: 'https://server.dummy/ep3',
    publishedAt: new Date(ep3date),
    categories: [],
    keywords: ['key3'],
  },
  {
    title: 'Ep2',
    url: 'https://server.dummy/ep2',
    publishedAt: new Date(ep2date),
    categories: [],
    keywords: ['key2'],
  },
  {
    title: 'Ep1',
    url: 'https://server.dummy/ep1',
    publishedAt: new Date(ep1date),
    categories: ['cat1'],
    keywords: [],
  },
];

const BASE_CACHED_METADATA = {
  subscribeUrl: 'https://example.com/foo',
  title: 'cachedTitle',
  description: 'cachedDescription',
  imageUrl: 'https://cached.imgurl/img.png?ver=0',
  imageTitle: 'cachedImageTitle',
  unknownField: 'cachedUnknownField',
  categories: ['cached cat'], // ignored by postPodcastMetadata
  keywords: ['cached key'], // ignored by postPodcastMetadata
  episodes: [], // ignored by postPodcastMetadata
};

const BASE_NEW_METADATA = {
  subscribeUrl: 'https://example.com/foo',
  title: 'newTitle',
  description: 'newDescription',
  language: 'en-us',
  categories: ['podcat1', 'podcat2'],
  keywords: ['podkey1', 'podkey2'],
  episodes: allEpisodes,
};

function cachedMetadata(additionalFields = {}) {
  return { ...BASE_CACHED_METADATA, ...additionalFields };
}

function newMetadata(additionalFields = {}) {
  return { ...BASE_NEW_METADATA, ...additionalFields };
}

const stubbedWallet = {};

const originalVersion = process.env.VERSION;
const originalTagPrefix = process.env.TAG_PREFIX;
beforeAll(() => {
  Object.assign(process.env, {
    VERSION: 'testVersion',
    TAG_PREFIX: 'abc',
  });
});

beforeEach(() => {
  advanceTo(new Date('2019-11-05'));
});

afterAll(() => {
  process.env.VERSION = originalVersion;
  process.env.TAG_PREFIX = originalTagPrefix;
});

describe('postPodcastMetadata', () => {
  function assertAddTagCalls(expectedTags) {
    const formattedExpectedTags = [
      ['Content-Type', 'application/json'],
      ['Unix-Time', unixTimestamp()],
      [toTag('version'), 'testVersion'],
    ].concat(expectedTags.map(([k, v]) => [toTag(k), v]));

    expect(addTag.mock.calls).toEqual(formattedExpectedTags);
  }

  describe('When there is no cached metadata yet for the podcast to be posted to Arweave', () => {
    it('creates a transaction with the expected metadata and tags', async () => {
      expect(createTransaction).not.toHaveBeenCalled();
      expect(addTag).not.toHaveBeenCalled();

      const expectedMetadata = newMetadata();
      const expectedTags = [
        ['subscribeUrl', 'https://example.com/foo'],
        ['title', 'newTitle'],
        ['description', 'newDescription'],
        ['language', 'en-us'],
        ['category', 'podcat1'],
        ['category', 'podcat2'],
        ['keyword', 'podkey1'],
        ['keyword', 'podkey2'],
        ['firstEpisodeDate', ep1date],
        ['lastEpisodeDate', ep4date],
        ['metadataBatch', '0'],
      ];
      await postPodcastMetadata(stubbedWallet, expectedMetadata, {});
      expect(createTransaction)
        .toHaveBeenCalledWith({ data: JSON.stringify(expectedMetadata) }, stubbedWallet);
      assertAddTagCalls(expectedTags);
    });
  });

  describe('When 1 cached batch of older metadata exists', () => {
    it('creates a transaction with the expected metadata and tags', async () => {
      expect(createTransaction).not.toHaveBeenCalled();
      expect(addTag).not.toHaveBeenCalled();

      const currentBatchFields = {
        firstEpisodeDate: ep1date,
        lastEpisodeDate: ep2date,
        metadataBatch: 0,
      };
      const expectedMetadata = newMetadata({ episodes: allEpisodes.slice(0, 2) });
      const expectedTags = [
        ['subscribeUrl', 'https://example.com/foo'],
        ['title', 'newTitle'],
        ['description', 'newDescription'],
        ['language', 'en-us'],
        ['category', 'podcat1'],
        ['category', 'podcat2'],
        ['keyword', 'podkey1'],
        ['keyword', 'podkey2'],
        ['firstEpisodeDate', ep3date],
        ['lastEpisodeDate', ep4date],
        ['metadataBatch', '1'],
      ];
      await postPodcastMetadata(
        stubbedWallet,
        expectedMetadata,
        cachedMetadata(currentBatchFields),
      );
      expect(createTransaction)
        .toHaveBeenCalledWith({ data: JSON.stringify(expectedMetadata) }, stubbedWallet);
      assertAddTagCalls(expectedTags);
    });
  });

  xdescribe('When 1 cached batch of newer metadata exists', () => {
    // TODO: Not yet implemented
  });

  describe('When 2 aggregated cached batches of older metadata exist', () => {
    it('creates a transaction with the expected metadata and tags', async () => {
      expect(createTransaction).not.toHaveBeenCalled();
      expect(addTag).not.toHaveBeenCalled();

      const currentBatchFields = {
        firstEpisodeDate: ep1date,
        lastEpisodeDate: ep3date,
        metadataBatch: 1,
      };
      const expectedMetadata = newMetadata({ episodes: allEpisodes.slice(0, 1) });
      const expectedTags = [
        ['subscribeUrl', 'https://example.com/foo'],
        ['title', 'newTitle'],
        ['description', 'newDescription'],
        ['language', 'en-us'],
        ['category', 'podcat1'],
        ['category', 'podcat2'],
        ['keyword', 'podkey1'],
        ['keyword', 'podkey2'],
        ['firstEpisodeDate', ep4date],
        ['lastEpisodeDate', ep4date],
        ['metadataBatch', '2'],
      ];
      await postPodcastMetadata(
        stubbedWallet,
        expectedMetadata,
        cachedMetadata(currentBatchFields),
      );
      expect(createTransaction)
        .toHaveBeenCalledWith({ data: JSON.stringify(expectedMetadata) }, stubbedWallet);
      assertAddTagCalls(expectedTags);
    });
  });
});
