import { initArSyncTxs, startSync, ArSyncTxStatus } from '..';
// eslint-disable-next-line import/named
import { addTag } from '../../client';
import { newMetadataTransaction, signAndPostTransaction } from '../../create-transaction';

jest.mock('../../create-transaction', () => ({
  ...jest.requireActual('../../create-transaction'),
  newMetadataTransaction: jest.fn(),
  signAndPostTransaction: jest.fn(),
}));
jest.mock('../../client');

const podcast1episodes = [
  {
    title: 'Ep3',
    url: 'https://server.dummy/ep3',
    publishedAt: new Date('2021-11-09T15:06:18.000Z'),
  },
  {
    title: 'Ep2',
    url: 'https://server.dummy/ep2',
    publishedAt: new Date('2021-11-08T05:00:00.000Z'),
  },
  {
    title: 'Ep1',
    url: 'https://server.dummy/ep1',
    publishedAt: new Date('2021-11-08T04:00:00.000Z'),
  },
];
const podcast2episodes = [
  {
    title: 'Ep23',
    url: 'https://server.dummy/ep23',
    publishedAt: new Date('2021-11-09T15:06:18.000Z'),
  },
  {
    title: 'Ep22',
    url: 'https://server.dummy/ep22',
    publishedAt: new Date('2021-11-08T05:00:00.000Z'),
  },
  {
    title: 'Ep21',
    url: 'https://server.dummy/ep21',
    publishedAt: new Date('2021-11-08T04:00:00.000Z'),
  },
];
const podcast1 = {
  subscribeUrl: 'https://example.com/podcast1',
  title: 'cachedTitle',
  description: 'cachedDescription',
  imageUrl: 'https://cached.imgurl/img.png?ver=0',
  imageTitle: 'cachedImageTitle',
  unknownField: 'cachedUnknownField',
  categories: ['cached cat'],
  keywords: ['cached key'],
  episodes: podcast1episodes,
};
const podcast2 = {
  subscribeUrl: 'https://example.com/podcast2',
  title: 'podcast2 cachedTitle',
  description: 'podcast2 cachedDescription',
  episodes: podcast2episodes,
};
const wallet = {};
const mockTransaction = { addTag };
const mockTransaction2 = { addTag, id: 'transaction 2' };
const mockTransaction3 = { addTag, id: 'transaction 3' };
const mockError = new Error('mock error');
const mockError2 = new Error('mock error 2');
const NON_EMPTY_STRING = expect.stringMatching(/.+/);
/**
 * NOTE: newMetadataTransaction() is mocked here, as it's tested in create-transaction.test.js.
 */
describe('initArSyncTxs', () => {
  const subscriptions = [podcast1, podcast2];

  describe('When metadataToSync is empty', () => {
    const metadataToSync = [];

    it('returns 0 txs', async () => {
      const result = await initArSyncTxs(subscriptions, metadataToSync, wallet);
      expect(result).toStrictEqual([]);
    });
  });

  describe('When metadataToSync is effectively empty', () => {
    const metadataToSync = [{
      subscribeUrl: 'https://example.com/podcast2',
      episodes: [],
    }];

    it('returns 0 txs', async () => {
      const result = await initArSyncTxs(subscriptions, metadataToSync, wallet);
      expect(result).toStrictEqual([]);
    });
  });

  describe('When there is metadataToSync', () => {
    describe('When metadataToSync specifies 1 out of 2 podcasts', () => {
      const metadataToSync = [
        {
          subscribeUrl: 'https://example.com/nothing_to_see_here',
        },
        {
          subscribeUrl: 'https://example.com/podcast2',
          title: 'podcast2 newTitle',
          episodes: podcast2episodes,
        },
      ];

      it('returns 1 initialized tx', async () => {
        newMetadataTransaction.mockResolvedValueOnce(mockTransaction);
        const result = await initArSyncTxs(subscriptions, metadataToSync, wallet);
        expect(result).toStrictEqual([
          {
            id: NON_EMPTY_STRING,
            subscribeUrl: 'https://example.com/podcast2',
            title: 'podcast2 cachedTitle',
            resultObj: mockTransaction,
            metadata: {
              ...metadataToSync[1],
              firstEpisodeDate: podcast2episodes[2].publishedAt,
              lastEpisodeDate: podcast2episodes[0].publishedAt,
              metadataBatch: 0,
            },
            numEpisodes: 3,
            status: ArSyncTxStatus.INITIALIZED,
          },
        ]);
      });
    });

    describe('When metadataToSync specifies 2 out of 2 podcasts', () => {
      const metadataToSync = [
        {
          subscribeUrl: 'https://example.com/podcast1',
          title: 'newTitle',
          description: 'newDescription',
        },
        {
          subscribeUrl: 'https://example.com/podcast2',
          title: 'podcast2 newTitle',
          episodes: podcast2episodes,
        },
      ];

      describe('When both podcasts to sync return a Transaction', () => {
        it('returns 2 initialized txs', async () => {
          newMetadataTransaction.mockResolvedValueOnce(mockTransaction);
          newMetadataTransaction.mockResolvedValueOnce(mockTransaction2);
          const result = await initArSyncTxs(subscriptions, metadataToSync, wallet);
          expect(result).toStrictEqual([
            {
              id: NON_EMPTY_STRING,
              subscribeUrl: 'https://example.com/podcast1',
              title: 'cachedTitle',
              resultObj: mockTransaction,
              metadata: metadataToSync[0],
              numEpisodes: 0,
              status: ArSyncTxStatus.INITIALIZED,
            },
            {
              id: NON_EMPTY_STRING,
              subscribeUrl: 'https://example.com/podcast2',
              title: 'podcast2 cachedTitle',
              resultObj: mockTransaction2,
              metadata: {
                ...metadataToSync[1],
                firstEpisodeDate: podcast2episodes[2].publishedAt,
                lastEpisodeDate: podcast2episodes[0].publishedAt,
                metadataBatch: 0,
              },
              numEpisodes: 3,
              status: ArSyncTxStatus.INITIALIZED,
            },
          ]);
        });
      });

      describe('When 1 podcast to sync throws an error', () => {
        it('returns 1 initialized tx and 1 errored tx', async () => {
          newMetadataTransaction.mockRejectedValueOnce(mockError);
          newMetadataTransaction.mockResolvedValueOnce(mockTransaction);
          const result = await initArSyncTxs(subscriptions, metadataToSync, wallet);
          expect(result).toStrictEqual([
            {
              id: NON_EMPTY_STRING,
              subscribeUrl: 'https://example.com/podcast1',
              title: 'cachedTitle',
              resultObj: mockError,
              metadata: metadataToSync[0],
              numEpisodes: 0,
              status: ArSyncTxStatus.ERRORED,
            },
            {
              id: NON_EMPTY_STRING,
              subscribeUrl: 'https://example.com/podcast2',
              title: 'podcast2 cachedTitle',
              resultObj: mockTransaction,
              metadata: {
                ...metadataToSync[1],
                firstEpisodeDate: podcast2episodes[2].publishedAt,
                lastEpisodeDate: podcast2episodes[0].publishedAt,
                metadataBatch: 0,
              },
              numEpisodes: 3,
              status: ArSyncTxStatus.INITIALIZED,
            },
          ]);
        });
      });

      describe('When both podcasts to sync throw an error', () => {
        it('returns 2 errored txs', async () => {
          newMetadataTransaction.mockRejectedValueOnce(mockError);
          newMetadataTransaction.mockRejectedValueOnce(mockError2);
          const result = await initArSyncTxs(subscriptions, metadataToSync, wallet);
          expect(result).toStrictEqual([
            {
              id: NON_EMPTY_STRING,
              subscribeUrl: 'https://example.com/podcast1',
              title: 'cachedTitle',
              resultObj: mockError,
              metadata: metadataToSync[0],
              numEpisodes: 0,
              status: ArSyncTxStatus.ERRORED,
            },
            {
              id: NON_EMPTY_STRING,
              subscribeUrl: 'https://example.com/podcast2',
              title: 'podcast2 cachedTitle',
              resultObj: mockError2,
              metadata: {
                ...metadataToSync[1],
                firstEpisodeDate: podcast2episodes[2].publishedAt,
                lastEpisodeDate: podcast2episodes[0].publishedAt,
                metadataBatch: 0,
              },
              numEpisodes: 3,
              status: ArSyncTxStatus.ERRORED,
            },
          ]);
        });
      });
    });
  });
});

describe('startSync', () => {
  const mockMetadata1 = { subscribeUrl: 'https://example.com/podcast1' };
  const mockMetadata2 = { subscribeUrl: 'https://example.com/podcast2' };
  const mockMetadata3 = { subscribeUrl: 'https://example.com/podcast3' };

  describe('When pendingTxs is empty', () => {
    const pendingTxs = [];

    it('returns 0 txs and 0 failedTxs', async () => {
      const result = await startSync(pendingTxs, wallet);
      expect(result).toStrictEqual([]);
    });
  });

  describe('When there are 2 initialized txs and 1 fails to post', () => {
    const arSyncTxs = [
      {
        id: '1',
        subscribeUrl: 'https://example.com/podcast1',
        title: 'cachedTitle',
        resultObj: mockTransaction,
        metadata: mockMetadata1,
        numEpisodes: 0,
        status: ArSyncTxStatus.INITIALIZED,
      },
      {
        id: '2',
        subscribeUrl: 'https://example.com/podcast2',
        title: 'podcast2 cachedTitle',
        resultObj: mockTransaction,
        metadata: mockMetadata2,
        numEpisodes: 0,
        status: ArSyncTxStatus.INITIALIZED,
      },
    ];

    it('returns 1 posted tx and 1 errored tx', async () => {
      signAndPostTransaction.mockRejectedValueOnce(mockError);
      signAndPostTransaction.mockResolvedValueOnce(mockTransaction);
      const result = await startSync(arSyncTxs, wallet);
      expect(result).toStrictEqual([
        {
          id: '1',
          subscribeUrl: 'https://example.com/podcast1',
          title: 'cachedTitle',
          resultObj: mockError,
          metadata: mockMetadata1,
          numEpisodes: 0,
          status: ArSyncTxStatus.ERRORED,
        },
        {
          id: '2',
          subscribeUrl: 'https://example.com/podcast2',
          title: 'podcast2 cachedTitle',
          resultObj: mockTransaction,
          metadata: mockMetadata2,
          numEpisodes: 0,
          status: ArSyncTxStatus.POSTED,
        },
      ]);
    });
  });

  describe('When there are 1 initialized tx and 2 other txs', () => {
    const arSyncTxs = [
      {
        id: '1',
        subscribeUrl: 'https://example.com/podcast1',
        title: 'cachedTitle',
        resultObj: mockTransaction,
        metadata: mockMetadata1,
        numEpisodes: 0,
        status: ArSyncTxStatus.ERRORED,
      },
      {
        id: '2',
        subscribeUrl: 'https://example.com/podcast2',
        title: 'podcast2 cachedTitle',
        resultObj: mockTransaction2,
        metadata: mockMetadata2,
        numEpisodes: 0,
        status: ArSyncTxStatus.INITIALIZED,
      },
      {
        id: '3',
        subscribeUrl: 'https://example.com/podcast3',
        title: 'podcast3 cachedTitle',
        resultObj: mockTransaction3,
        metadata: mockMetadata3,
        numEpisodes: 0,
        status: ArSyncTxStatus.CONFIRMED,
      },
    ];

    it('returns 1 posted tx along with the 2 other txs', async () => {
      signAndPostTransaction.mockResolvedValueOnce(mockTransaction2);
      const result = await startSync(arSyncTxs, wallet);
      expect(result).toEqual([
        {
          id: '1',
          subscribeUrl: 'https://example.com/podcast1',
          title: 'cachedTitle',
          resultObj: mockTransaction,
          metadata: mockMetadata1,
          numEpisodes: 0,
          status: ArSyncTxStatus.ERRORED,
        },
        {
          id: '2',
          subscribeUrl: 'https://example.com/podcast2',
          title: 'podcast2 cachedTitle',
          resultObj: mockTransaction2,
          metadata: mockMetadata2,
          numEpisodes: 0,
          status: ArSyncTxStatus.POSTED,
        },
        {
          id: '3',
          subscribeUrl: 'https://example.com/podcast3',
          title: 'podcast3 cachedTitle',
          resultObj: mockTransaction3,
          metadata: mockMetadata3,
          numEpisodes: 0,
          status: ArSyncTxStatus.CONFIRMED,
        },
      ]);
    });
  });
});
