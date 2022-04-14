import { mergeEpisodeBatches, mergeBatchMetadata, mergeBatchTags } from '../merge-logic';

const originalTagPrefix = process.env.TAG_PREFIX;
const testTag = 'testPonder';

beforeAll(() => {
  Object.assign(process.env, { TAG_PREFIX: testTag });
});

afterAll(() => {
  process.env.TAG_PREFIX = originalTagPrefix;
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
      keywords: [],
    },
  ];
  const oldEpisodes = [episodes[2], episodes[3]];
  const newEpisodes = [episodes[0], episodes[1]];
  const episodes3and1 = [episodes[1], episodes[3]];
  const episodes4and2 = [episodes[0], episodes[2]];
  const episodes421 = [episodes[0], episodes[2], episodes[3]];
  const episode3 = episodes[1];
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
      url: 'https://server.dummy/ep1',
      publishedAt: new Date('2021-11-08T04:00:00.000Z'),
      categories: ['newcat1'],
      keywords: [],
    },
  ];

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
          categories: ['cat1', 'newcat1'],
          keywords: [],
        },
      ]);
    };

    describe('When given 2 equal batches with just 1 episode each', () => {
      it('returns an array with the 1 episode metadata', () => {
        expect(mergeEpisodeBatches([[episode3], [episode3]])).toStrictEqual([episode3]);
      });
    });

    describe('When given 1 older batch + 1 newer batch + 1 batch with updated metadata', () => {
      it('returns a sorted array of merged episodes', () => {
        assertMergedResult(mergeEpisodeBatches([oldEpisodes, newEpisodes, updatedEpisodes]));
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
    },
    {
      description: 'description1',
      imageUrl: 'https://imgurl/img.png?ver=1',
      imageTitle: 'imageTitle1',
      language: 'en-us',
      episodes: [],
    },
    {
      description: 'description2',
      imageUrl: 'https://imgurl/img.png?ver=2',
      imageTitle: 'imageTitle2',
      language: 'en-us',
      episodes: [],
    },
  ];

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

  describe('When given 2 batches of podcast metadata', () => {
    it('returns the merged podcast metadata where the 2nd batch takes precedence', () => {
      expect(mergeBatchMetadata(metadataBatches.slice(0, 2))).toStrictEqual({
        description: 'description1',
        imageUrl: 'https://imgurl/img.png?ver=1',
        imageTitle: 'imageTitle1',
        unknownField: 'unknownFieldValue',
        language: 'en-us',
        episodes: [],
      });
    });
  });

  describe('When given 3 batches of podcast metadata', () => {
    it('returns the merged podcast metadata where the later batches take precedence', () => {
      expect(mergeBatchMetadata(metadataBatches)).toStrictEqual({
        description: 'description2',
        imageUrl: 'https://imgurl/img.png?ver=2',
        imageTitle: 'imageTitle2',
        unknownField: 'unknownFieldValue',
        language: 'en-us',
        episodes: [],
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

    it('returns the min firstEpisodeDate, max lastEpisodeDate, max metadataBatch, ' +
       'regardless of batch order', () => {
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
