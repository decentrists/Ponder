import { strToU8, compressSync } from 'fflate';
import { newMetadataTransaction } from '../create-transaction';
import { toTag } from '../utils';
// eslint-disable-next-line import/named
import { addTag, createTransaction } from '../client';

const MOCK_TIMESTAMP = 1234001234;
const MOCK_U8_METADATA = new Uint8Array([2, 3]);

jest.mock('fflate', () => ({
  strToU8: jest.fn(),
  compressSync: jest.fn().mockImplementation(() => MOCK_U8_METADATA),
}));
jest.mock('../../../utils', () => ({
  ...jest.requireActual('../../../utils'),
  unixTimestamp: jest.fn().mockImplementation(() => MOCK_TIMESTAMP),
}));
jest.mock('../client');

const mockResult = { addTag };
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
  categories: ['cached cat'], // ignored by newMetadataTransaction
  keywords: ['cached key'], // ignored by newMetadataTransaction
  episodes: [], // ignored by newMetadataTransaction
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

const originalVersion = process.env.REACT_APP_VERSION;
const originalTagPrefix = process.env.REACT_APP_TAG_PREFIX;
beforeAll(() => {
  Object.assign(process.env, {
    REACT_APP_VERSION: 'testVersion',
    REACT_APP_TAG_PREFIX: 'testPonder',
  });
  jest.useFakeTimers().setSystemTime(new Date('2019-11-05'));
});

afterAll(() => {
  process.env.REACT_APP_VERSION = originalVersion;
  process.env.REACT_APP_TAG_PREFIX = originalTagPrefix;
  jest.useRealTimers();
});

describe('newMetadataTransaction', () => {
  beforeEach(() => {
    expect(createTransaction).not.toHaveBeenCalled();
    expect(addTag).not.toHaveBeenCalled();
  });

  function assertAddTagCalls(expectedTags) {
    const formattedExpectedTags = [
      ['App-Name', 'testPonder'],
      ['App-Version', 'testVersion'],
      ['Content-Type', 'application/gzip'],
      ['Unix-Time', `${MOCK_TIMESTAMP}`],
    ].concat(expectedTags.map(([k, v]) => [toTag(k), v]));

    expect(addTag.mock.calls).toEqual(formattedExpectedTags);
  }

  const withAndWithoutArConnect = assertTest => {
    describe('With ArConnect disabled', () => {
      assertTest();
    });

    describe('With ArConnect enabled', () => {
      beforeAll(() => { global.enableArConnect(); });

      afterAll(() => { global.disableArConnect(); });

      assertTest({ useArConnect: true });
    });
  };

  describe('When there is no cached metadata yet for the podcast to be posted to Arweave', () => {
    const assertTest = (modifiers = { useArConnect: false }) => {
      it('creates a transaction with the expected metadata and tags', async () => {
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

        const result = await newMetadataTransaction(stubbedWallet, expectedMetadata, {});
        expect(result).toEqual(mockResult);

        expect(strToU8).toHaveBeenCalledWith(JSON.stringify(expectedMetadata));
        expect(compressSync).toHaveBeenCalled();

        const params = modifiers.useArConnect
          ? [{ data: MOCK_U8_METADATA }]
          : [{ data: MOCK_U8_METADATA }, stubbedWallet];
        expect(createTransaction).toHaveBeenCalledWith(...params);

        assertAddTagCalls(expectedTags);
      });
    };

    withAndWithoutArConnect(assertTest);
  });

  describe('When 1 cached batch of older metadata exists', () => {
    const assertTest = (modifiers = { useArConnect: false }) => {
      it('creates a transaction with the expected metadata and tags', async () => {
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
        const result = await newMetadataTransaction(
          stubbedWallet,
          expectedMetadata,
          cachedMetadata(currentBatchFields),
        );
        expect(result).toEqual(mockResult);

        expect(strToU8).toHaveBeenCalledWith(JSON.stringify(expectedMetadata));
        expect(compressSync).toHaveBeenCalled();

        const params = modifiers.useArConnect
          ? [{ data: MOCK_U8_METADATA }]
          : [{ data: MOCK_U8_METADATA }, stubbedWallet];
        expect(createTransaction).toHaveBeenCalledWith(...params);

        assertAddTagCalls(expectedTags);
      });
    };

    withAndWithoutArConnect(assertTest);
  });

  xdescribe('When 1 cached batch of newer metadata exists', () => {
    // TODO: Not yet implemented
  });

  describe('When 2 aggregated cached batches of older metadata exist', () => {
    const assertTest = (modifiers = { useArConnect: false }) => {
      it('creates a transaction with the expected metadata and tags', async () => {
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
        const result = await newMetadataTransaction(
          stubbedWallet,
          expectedMetadata,
          cachedMetadata(currentBatchFields),
        );
        expect(result).toEqual(mockResult);

        expect(strToU8).toHaveBeenCalledWith(JSON.stringify(expectedMetadata));
        expect(compressSync).toHaveBeenCalled();

        const params = modifiers.useArConnect
          ? [{ data: MOCK_U8_METADATA }]
          : [{ data: MOCK_U8_METADATA }, stubbedWallet];
        expect(createTransaction).toHaveBeenCalledWith(...params);

        assertAddTagCalls(expectedTags);
      });
    };

    withAndWithoutArConnect(assertTest);
  });

  describe('Error handling', () => {
    const assertThrow = async (erroneousMetadata, errorRegex) => {
      await expect(newMetadataTransaction(stubbedWallet, erroneousMetadata, {}))
        .rejects.toThrow(errorRegex);

      expect(createTransaction).not.toHaveBeenCalled();
      expect(addTag).not.toHaveBeenCalled();
    };

    it('throws an Error if the newest episode has a null date', async () => {
      const erroneousMetadata = newMetadata({
        episodes: [
          { ...allEpisodes[0], publishedAt: null },
          allEpisodes[1],
        ],
      });
      assertThrow(erroneousMetadata, /Invalid date/);
    });

    it('throws an Error if the oldest episode has an invalid date', async () => {
      const erroneousMetadata = newMetadata({
        episodes: [
          allEpisodes[0],
          { ...allEpisodes[1], publishedAt: new Date(undefined) },
        ],
      });
      assertThrow(erroneousMetadata, /Invalid date/);
    });

    it('throws an Error if the oldest episode has an zero date', async () => {
      const erroneousMetadata = newMetadata({
        episodes: [
          allEpisodes[0],
          { ...allEpisodes[1], publishedAt: new Date(0) },
        ],
      });
      assertThrow(erroneousMetadata, /Invalid date/);
    });

    it('throws an Error if a mandatory podcast tag is missing', async () => {
      const erroneousMetadata = {
        subscribeUrl: 'https://example.com/foo',
        description: 'newDescription',
        episodes: allEpisodes,
      };
      assertThrow(erroneousMetadata, /title is missing/);
    });
  });
});
