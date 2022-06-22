import cloneDeep from 'lodash.clonedeep';
import {
  mergeEpisodeBatches,
  mergeBatchMetadata,
  mergeBatchTags,
  rightDiff,
} from '../diff-merge-logic';

const originalTagPrefix = process.env.REACT_APP_TAG_PREFIX;
const testTag = 'testPonder';

/* Array of deep cloned objects, which should be set in beforeAll() through saveDeepClones(),
 * if assertUnmutatedParams() is called in afterEach()
 * NOTE: this is not a LUT, so do not nest saveDeepClones() */
let deepClonedParams;

function assertUnmutatedParams(params) {
  params.forEach((param, index) => {
    expect(param).toEqual(deepClonedParams[index]);
  });
}

function saveDeepClones(params) {
  deepClonedParams = params.map(cloneDeep);
}

beforeAll(() => {
  Object.assign(process.env, { REACT_APP_TAG_PREFIX: testTag });
});

afterAll(() => {
  process.env.REACT_APP_TAG_PREFIX = originalTagPrefix;
});

describe('mergeEpisodeBatches', () => {
  // metadataBatches[i].episodes are ordered from new to old
  const episodes = [
    {
      title: 'Ep4',
      url: 'https://server.dummy/ep4',
      publishedAt: new Date('2021-11-10T15:06:18.000Z'),
      categories: ['cat4'],
      keywords: [],
    },
    {
      title: 'Ep3',
      url: 'https://server.dummy/ep3',
      publishedAt: new Date('2021-11-09T15:06:18.000Z'),
      categories: [],
      keywords: ['key3'],
    },
    {
      title: 'Ep2',
      url: 'https://server.dummy/ep2',
      publishedAt: new Date('2021-11-08T05:00:00.000Z'),
      categories: [],
      keywords: ['key2'],
    },
    {
      title: 'Ep1',
      url: 'https://server.dummy/ep1',
      publishedAt: new Date('2021-11-08T04:00:00.000Z'),
      categories: ['cat1'],
    },
  ];
  const oldEpisodes = [episodes[2], episodes[3]];
  const newEpisodes = [episodes[0], episodes[1]];
  const episodes3and1 = [episodes[1], episodes[3]];
  const episodes4and2 = [episodes[0], episodes[2]];
  const episodes421 = [episodes[0], episodes[2], episodes[3]];
  const episode3 = episodes[1];

  describe('Without duplicate episodes metadata', () => {
    describe('When given 1 empty batch of episodes metadata', () => {
      it('returns an empty array', () => {
        expect(mergeEpisodeBatches([[]])).toStrictEqual([]);
      });
    });

    describe('When given 1 batch with 1 episode with only a publishedAt prop', () => {
      it('returns an array with the minimal episode\'s metadata', () => {
        const minimalEpisode = { publishedAt: new Date('2021-11-10T15:06:18.000Z') };
        expect(mergeEpisodeBatches([[minimalEpisode]])).toStrictEqual([minimalEpisode]);
      });
    });

    describe('When given 1 batch', () => {
      it('returns an array of batch 1\'s episodes', () => {
        expect(mergeEpisodeBatches([episodes])).toStrictEqual(episodes);
      });
    });

    describe('When given 1 batch + 1 empty batch', () => {
      it('returns an array of batch 1\'s episodes', () => {
        expect(mergeEpisodeBatches([episodes, []])).toStrictEqual(episodes);
        expect(mergeEpisodeBatches([[], episodes])).toStrictEqual(episodes);
      });
    });

    describe('When given 1 older batch + 1 newer batch', () => {
      it('returns a sorted array of all episodes', () => {
        expect(mergeEpisodeBatches([oldEpisodes, newEpisodes])).toStrictEqual(episodes);
      });
    });

    describe('When given 1 newer + 1 older batch, both with interleaved episodes', () => {
      it('returns a sorted array of all episodes', () => {
        expect(mergeEpisodeBatches([episodes4and2, episodes3and1])).toStrictEqual(episodes);
        expect(mergeEpisodeBatches([episodes3and1, episodes4and2])).toStrictEqual(episodes);
      });
    });

    describe('When batch 2 contains an episode missing from the middle of batch 1', () => {
      it('returns a sorted array of all episodes', () => {
        expect(mergeEpisodeBatches([episodes421, [episode3]])).toStrictEqual(episodes);
      });
    });
  });

  describe('When some batches contain duplicate episodes metadata', () => {
    const updatedEpisodes = [
      {
        title: 'Ep4',
        url: 'https://server.dummy/ep4',
        publishedAt: new Date('2021-11-10T15:06:18.000Z'),
        categories: ['newcat4'],
        keywords: [],
      },
      {
        title: 'NewEp1',
        url: '',
        publishedAt: new Date('2021-11-08T04:00:00.000Z'),
        categories: [''],
        keywords: ['newkey1'],
      },
    ];

    const assertMergedResult = result => {
      expect(result).toEqual([
        {
          title: 'Ep4',
          url: 'https://server.dummy/ep4',
          publishedAt: episodes[0].publishedAt,
          categories: ['cat4', 'newcat4'],
          keywords: [],
        },
        {
          title: 'Ep3',
          url: 'https://server.dummy/ep3',
          publishedAt: episodes[1].publishedAt,
          categories: [],
          keywords: ['key3'],
        },
        {
          title: 'Ep2',
          url: 'https://server.dummy/ep2',
          publishedAt: episodes[2].publishedAt,
          categories: [],
          keywords: ['key2'],
        },
        {
          title: 'NewEp1',
          url: 'https://server.dummy/ep1',
          publishedAt: episodes[3].publishedAt,
          categories: ['cat1'],
          keywords: ['newkey1'],
        },
      ]);
    };

    describe('When given 2 equal batches with just 1 episode each', () => {
      it('returns an array with the 1 episode metadata', () => {
        expect(mergeEpisodeBatches([[episode3], [episode3]])).toStrictEqual([episode3]);
      });
    });

    describe('When given 1 older batch + 1 newer batch + 1 batch with updated metadata', () => {
      const batches = [{}, oldEpisodes, newEpisodes, updatedEpisodes];

      beforeAll(() => {
        saveDeepClones([batches]);
      });

      afterEach(() => {
        assertUnmutatedParams([batches]);
      });

      it('returns a sorted array of merged episodes and does not mutate the batch list', () => {
        assertMergedResult(mergeEpisodeBatches(batches));
        assertMergedResult(mergeEpisodeBatches(batches));
      });
    });

    describe('When given 1 newer batch + 1 older batch + 1 batch with updated metadata', () => {
      it('returns a sorted array of merged episodes', () => {
        assertMergedResult(mergeEpisodeBatches([newEpisodes, oldEpisodes, updatedEpisodes]));
      });
    });
  });
});

describe('mergeBatchMetadata', () => {
  // Each metadataBatches[i] mimicks a podcast metadata object as parsed from the JSON payload of an
  // Arweave transaction. Therefore, the following props reside elsewhere, namely in the tags:
  // { subscribeUrl, title, categories, keywords, firstEpisodeDate, lastEpisodeDate, metadataBatch }
  //
  // metadataBatches[i] are ordered from old to new, where metadata of newer batches take precedence
  const metadataBatches = [
    {
      description: 'description0',
      imageUrl: 'https://imgurl/img.png?ver=0',
      imageTitle: 'imageTitle0',
      unknownField: 'unknownFieldValue',
      episodes: [], // left empty, because tested separately
      categories: ['cat0'],
    },
    {
      description: 'description1',
      imageUrl: 'https://imgurl/img.png?ver=1',
      imageTitle: 'imageTitle1',
      language: 'en-us',
      episodes: [],
      categories: ['cat1'],
    },
    {
      description: '',
      imageUrl: 'https://imgurl/img.png?ver=2',
      imageTitle: 'imageTitle2',
      language: 'en-us',
      episodes: [],
      categories: [],
      keywords: [],
    },
  ];

  beforeAll(() => {
    saveDeepClones([metadataBatches]);
  });

  afterEach(() => {
    assertUnmutatedParams([metadataBatches]);
  });

  describe('When given 1 empty batch of podcast metadata', () => {
    it('returns an empty object', () => {
      expect(mergeBatchMetadata([{}])).toStrictEqual({});
    });
  });

  describe('When given 1 batch of podcast metadata', () => {
    it('returns the same batch', () => {
      expect(mergeBatchMetadata([metadataBatches[0]])).toStrictEqual(metadataBatches[0]);
    });
  });

  describe('When given 1 batch of podcast metadata and 1 or 2 empty batches', () => {
    it('returns the non-empty batch', () => {
      const validBatch = metadataBatches[0];
      expect(mergeBatchMetadata([validBatch, {}])).toStrictEqual(validBatch);
      expect(mergeBatchMetadata([{}, validBatch, {}], true)).toStrictEqual(validBatch);
      expect(mergeBatchMetadata([{}, validBatch, {}], false)).toStrictEqual(validBatch);
    });
  });

  describe('When given 2 batches of podcast metadata', () => {
    it('returns the merged podcast metadata where the 2nd batch takes precedence', () => {
      expect(mergeBatchMetadata(metadataBatches.slice(0, 2))).toStrictEqual({
        description: 'description1',
        imageUrl: 'https://imgurl/img.png?ver=1',
        imageTitle: 'imageTitle1',
        unknownField: 'unknownFieldValue',
        language: 'en-us',
        episodes: [],
        categories: ['cat1'],
      });
    });
  });

  describe('When given multiple batches and parameter applyMergeSpecialTags = false', () => {
    it('categories of the latest batch holds, unless they are empty', () => {
      expect(mergeBatchMetadata(metadataBatches)).toStrictEqual({
        description: 'description1',
        imageUrl: 'https://imgurl/img.png?ver=2',
        imageTitle: 'imageTitle2',
        unknownField: 'unknownFieldValue',
        language: 'en-us',
        episodes: [],
        categories: ['cat1'],
      });
    });
  });

  describe('When given multiple batches and parameter applyMergeSpecialTags = true', () => {
    it('categories are merged', () => {
      expect(mergeBatchMetadata(metadataBatches, true)).toStrictEqual({
        description: 'description1',
        imageUrl: 'https://imgurl/img.png?ver=2',
        imageTitle: 'imageTitle2',
        unknownField: 'unknownFieldValue',
        language: 'en-us',
        episodes: [],
        categories: ['cat0', 'cat1'],
      });
    });
  });
});

describe('mergeBatchTags', () => {
  const oldestDate = new Date('2018-10-03T23:00:00.000Z');
  const middleDate = new Date('2018-10-03T23:01:00.000Z');
  const newestDate = new Date('2018-10-03T23:02:00.000Z');
  const tagBatches = [
    {
      metadataBatch: '0',
      title: 'old title',
      description: 'description0',
      categories: ['old cat'],
      keywords: ['key0'],
      firstEpisodeDate: oldestDate,
      lastEpisodeDate: oldestDate,
    },
    {
      metadataBatch: '1',
      title: 'newer title',
      categories: [],
      keywords: ['key0', 'key1'],
      firstEpisodeDate: middleDate,
      lastEpisodeDate: middleDate,
    },
    {
      metadataBatch: '2',
      title: 'newest title',
      categories: ['new cat'],
      keywords: [],
      firstEpisodeDate: middleDate,
      lastEpisodeDate: newestDate,
    },
  ];

  beforeAll(() => {
    saveDeepClones([tagBatches]);
  });

  afterEach(() => {
    assertUnmutatedParams([tagBatches]);
  });

  describe('When given 1 empty batch of tags', () => {
    it('returns an empty object', () => {
      expect(mergeBatchTags([{}])).toStrictEqual({});
    });
  });

  describe('When given 1 batch of tags', () => {
    it('returns the same batch with correct value types', () => {
      expect(mergeBatchTags(tagBatches.slice(0, 1))).toStrictEqual({
        metadataBatch: 0,
        title: 'old title',
        description: 'description0',
        categories: ['old cat'],
        keywords: ['key0'],
        firstEpisodeDate: oldestDate,
        lastEpisodeDate: oldestDate,
      });
    });
  });

  describe('When given 2 batches of tags', () => {
    it('returns the merged tags where the 2nd batch takes precedence', () => {
      expect(mergeBatchTags(tagBatches.slice(0, 2))).toStrictEqual({
        metadataBatch: 1,
        title: 'newer title',
        description: 'description0',
        categories: ['old cat'],
        keywords: ['key0', 'key1'],
        firstEpisodeDate: oldestDate,
        lastEpisodeDate: middleDate,
      });
    });

    it('returns the min firstEpisodeDate, max lastEpisodeDate, max metadataBatch, '
       + 'regardless of batch order', () => {
      expect(mergeBatchTags(tagBatches.slice(0, 2).reverse())).toStrictEqual({
        metadataBatch: 1,
        title: 'old title',
        description: 'description0',
        categories: ['old cat'],
        keywords: ['key0', 'key1'],
        firstEpisodeDate: oldestDate,
        lastEpisodeDate: middleDate,
      });
    });
  });

  describe('When given 3 batches of podcast metadata', () => {
    it('returns the merged podcast metadata where the later batches take precedence', () => {
      expect(mergeBatchTags(tagBatches)).toStrictEqual({
        metadataBatch: 2,
        title: 'newest title',
        description: 'description0',
        categories: ['old cat', 'new cat'],
        keywords: ['key0', 'key1'],
        firstEpisodeDate: oldestDate,
        lastEpisodeDate: newestDate,
      });
    });
  });
});

describe('rightDiff', () => {
  const ep4date = new Date('2021-11-10T15:06:18.000Z');
  const ep3date = new Date('2021-11-09T15:06:18.000Z');
  const ep2date = new Date('2021-11-08T05:00:00.000Z');
  const ep1date = new Date('2021-11-08T04:00:00.000Z');
  const oldEpisodes = [ // sorted
    {
      title: 'Ep3',
      url: 'https://server.dummy/ep3',
      publishedAt: ep3date,
      categories: [],
      keywords: ['key3'],
    },
    {
      title: 'Ep2',
      url: 'https://server.dummy/ep2',
      publishedAt: ep2date,
      keywords: ['key2'],
    },
    {
      title: 'Ep1',
      url: 'https://server.dummy/ep1',
      publishedAt: ep1date,
      categories: ['cat1'],
    },
  ];
  const newEpisodes = [ // unsorted
    {
      title: 'Ep2',
      url: 'https://server.dummy/ep2',
      publishedAt: ep2date,
      categories: ['newcat2'],
      keywords: ['key2'],
    },
    {
      title: 'Ep1',
      url: 'https://server.dummy/ep1',
      publishedAt: ep1date,
      categories: ['cat1'],
      keywords: [],
    },
    {
      title: 'Ep4',
      url: 'https://server.dummy/ep4',
      publishedAt: ep4date,
      categories: ['cat4'],
      keywords: [],
    },
  ];

  describe('When the left set encloses the right set', () => {
    const oldMetadata = {
      description: 'description',
      subscribeUrl: 'https://server.dummy/feed',
      imageUrl: 'https://imgurl/img.png?ver=0',
      imageTitle: 'imageTitle',
      episodes: oldEpisodes,
    };
    const newMetadata = {
      description: '',
      episodes: oldEpisodes,
    };

    it('returns an empty diff', () => {
      expect(rightDiff(oldMetadata, newMetadata)).toEqual({});
    });
  });

  describe('When the left set is disjoint from the right set', () => {
    const oldMetadata = {
      keywords: ['key1'],
      episodes: [],
    };
    const newMetadata = {
      description: 'description',
      subscribeUrl: 'https://server.dummy/feed',
      imageUrl: 'https://imgurl/img.png?ver=0',
      imageTitle: 'imageTitle',
      episodes: oldEpisodes,
    };

    beforeAll(() => {
      saveDeepClones([oldMetadata, newMetadata]);
    });

    afterEach(() => {
      assertUnmutatedParams([oldMetadata, newMetadata]);
    });

    it('returns the right set and does not mutate either set', () => {
      expect(rightDiff(oldMetadata, newMetadata)).toStrictEqual(newMetadata);
      expect(rightDiff(oldMetadata, newMetadata)).toStrictEqual(newMetadata);
    });

    it('returns the right set (when the left set is empty)', () => {
      expect(rightDiff({}, newMetadata)).toStrictEqual(newMetadata);
    });

    it('returns the right set (when the right set is empty)', () => {
      expect(rightDiff(oldMetadata, {})).toEqual({});
    });
  });

  describe('When the right set contains 1 new metadatum', () => {
    const oldMetadata = {
      description: 'description',
      subscribeUrl: 'https://server.dummy/feed',
      imageUrl: 'https://imgurl/img.png?ver=0',
      imageTitle: 'imageTitle',
      episodes: oldEpisodes,
    };
    const newMetadata = {
      description: 'new description',
      imageTitle: '',
      episodes: oldEpisodes,
    };

    it('returns the right diff including the primary key subscribeUrl', () => {
      expect(rightDiff(oldMetadata, newMetadata)).toStrictEqual({
        description: 'new description',
        subscribeUrl: 'https://server.dummy/feed',
      });
    });
  });

  describe('When given 2 overlapping sets of podcast metadata', () => {
    const oldMetadata = {
      description: 'description',
      subscribeUrl: 'https://server.dummy/feed',
      imageUrl: 'https://imgurl/img.png?ver=0',
      imageTitle: 'imageTitle',
      unknownField: 'unknownFieldValue',
      episodes: oldEpisodes,
      categories: ['samecat', 'oldcat'],
    };
    const newMetadata = {
      description: 'description',
      subscribeUrl: 'https://server.dummy/feed',
      imageUrl: 'https://imgurl/img.png?ver=1',
      imageTitle: 'imageTitle',
      episodes: newEpisodes,
      categories: ['samecat', 'diffcat'],
      keywords: [''],
    };

    it('returns the right diff where primary key subscribeUrl persists for the podcast diff, '
       + 'publishedAt persists for each episode diff and the episodes diff is sorted', () => {
      expect(rightDiff(oldMetadata, newMetadata)).toStrictEqual({
        imageUrl: 'https://imgurl/img.png?ver=1',
        episodes: [
          {
            title: 'Ep4',
            url: 'https://server.dummy/ep4',
            publishedAt: ep4date,
            categories: ['cat4'],
            keywords: [],
          },
          {
            categories: ['newcat2'],
            publishedAt: ep2date,
          },
        ],
        categories: ['diffcat'],
        subscribeUrl: 'https://server.dummy/feed',
      });
    });
  });
});
