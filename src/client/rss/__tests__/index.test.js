import parser from '../parser';
import { getPodcastFeed } from '..';

jest.mock('../parser');

const FEED_URL = 'https://test_url.crypto/rss';

const ep1date = '2021-11-08T04:00:00.000Z';
const ep2date = '2021-11-08T05:00:00.000Z';
const ep3date = '2021-11-09T15:06:18.000Z';
const ep4date = '2021-11-10T15:06:18.000Z';
const podcastDate = '2022-01-01T04:00:00.000Z';

const COMPLETE_EPISODE_1 = {
  pubDate: ep1date,
  title: '',
  categories: ['Ep1cat1'],
  keywords: ['Ep1key1'],
  enclosure: {
    length: '12345678',
    type: 'audio/mpeg',
    url: 'https://test_url.crypto/ep1.mp3',
  },
  docs: 'https://test_url.crypto/info',
  image: {
    title: 'My imageTitle',
  },
  'content:encoded': '<b>html</b> Ep1 description',
  itunes: {
    title: 'Ep1 title',
    subtitle: '<b>Ep1 subtitle</b>',
    summary: 'Ep1 summary',
    guid: 'e6aa1148-e2c6-4fae-969c-0a38a977ce91',
    duration: '01:01',
    image: 'https://test_url.crypto/ep1image.jpeg',
    explicit: 'no',
    categories: ['ep1cat1', 'Ep1cat2'],
    keywords: ['Ep1key2'],
  },
};
const COMPLETE_EPISODE_2_NO_ITUNES = {
  isoDate: ep2date,
  title: 'Ep2 title',
  categories: ['Ep2cat'],
  keywords: ['Ep2key'],
  length: '12345678',
  enclosure: {
    type: 'audio/mpeg',
    url: 'https://test_url.crypto/ep2.mp3',
  },
  subtitle: '<b>Ep2 subtitle</b>',
  content: '<b>html</b> Ep2 description',
  guid: 'f6aa1148-e2c6-4fae-969c-0a38a977ce92',
  link: 'https://test_url.crypto/info',
  duration: '02:02',
  explicit: 'no',
  contentSnippet: 'Ep2 summary',
  image: {
    url: 'https://test_url.crypto/ep2image.jpeg',
    title: 'Specific imageTitle',
  },
};
const MINIMAL_EPISODE_3 = {
  title: 'Ep3 title',
  isoDate: ep3date,
};
const INVALID_EPISODE_4 = {
  title: '',
  isoDate: ep4date,
  keywords: ['skipped episodesKeyword'],
};
const INVALID_EPISODE_5 = {
  title: 'Ep5 title',
  isoDate: 'foo',
  keywords: ['another skipped episodesKeyword'],
};
const INVALID_EPISODE_6 = {
  title: 'Ep6 title',
  keywords: ['yet another skipped episodesKeyword'],
};
const EPISODES = [
  COMPLETE_EPISODE_1,
  COMPLETE_EPISODE_2_NO_ITUNES,
  MINIMAL_EPISODE_3,
  INVALID_EPISODE_4,
  INVALID_EPISODE_5,
  INVALID_EPISODE_6,
];

const COMPLETE_PODCAST = {
  feedUrl: FEED_URL,
  title: 'My podcast',
  categories: ['cat1'],
  keywords: ['key1'],
  docs: 'https://test_url.crypto/info',
  link: '',
  image: {
    title: 'My imageTitle',
  },
  unknownField: 'skipped field',
  lastBuildDate: podcastDate,
  itunes: {
    keywords: ['key2'],
    categories: ['cat2'],
    categoriesWithSubs: [
      {
        name: 'cat1',
        subs: [
          { name: 'subcat1' },
          { name: 'subcat2' },
        ],
      },
      {
        name: 'cat2',
        subs: null,
      },
    ],
    subtitle: '<b>Podcast subtitle</b>',
    description: 'Podcast description',
    summary: 'Podcast summary',
    image: 'https://test_url.crypto/podcast.jpeg',
    language: 'en',
    explicit: 'no',
    author: 'Podcast author',
    owner: {
      email: 'mail@test_url.crypto',
      name: 'Podcast owner',
    },
    copyright: 'Podcast copyright',
    managingEditor: 'Podcast editor',
  },
};
const COMPLETE_PODCAST_NO_ITUNES = {
  itunes: {},
  feedUrl: FEED_URL,
  title: 'My podcast',
  categories: ['cat1', 'cat2'],
  keywords: ['key1', 'key2'],
  docs: '',
  link: 'https://test_url.crypto/info',
  image: {
    title: 'My imageTitle',
    url: 'https://test_url.crypto/podcast.jpeg',
  },
  subtitle: '<b>Podcast subtitle</b>',
  description: 'Podcast description',
  summary: 'Podcast summary',
  language: 'en',
  explicit: 'no',
  author: '',
  creator: 'Podcast author',
  owner: {
    email: 'mail@test_url.crypto',
    name: 'Podcast owner',
  },
  copyright: 'Podcast copyright',
  lastBuildDate: podcastDate,
  managingEditor: 'Podcast editor',
};
const MINIMAL_PODCAST = {
  feedUrl: FEED_URL,
  title: 'My podcast',
};

describe('getPodcastFeed', () => {
  describe('With a complete podcast feed with 3 complete episodes and 3 invalid episodes', () => {
    const expected = {
      subscribeUrl: 'https://test_url.crypto/rss',
      title: 'My podcast',
      episodes: [
        {
          title: 'Ep1 title',
          publishedAt: new Date(ep1date),
          subtitle: 'Ep1 subtitle',
          contentHtml: '<b>html</b> Ep1 description',
          summary: 'Ep1 summary',
          guid: 'e6aa1148-e2c6-4fae-969c-0a38a977ce91',
          mediaUrl: 'https://test_url.crypto/ep1.mp3',
          mediaType: 'audio/mpeg',
          mediaLength: '12345678',
          duration: '01:01',
          imageUrl: 'https://test_url.crypto/ep1image.jpeg',
          categories: ['ep1cat1', 'ep1cat2'],
          keywords: ['ep1key1', 'ep1key2'],
        },
        {
          title: 'Ep2 title',
          publishedAt: new Date(ep2date),
          subtitle: 'Ep2 subtitle',
          contentHtml: '<b>html</b> Ep2 description',
          summary: 'Ep2 summary',
          guid: 'f6aa1148-e2c6-4fae-969c-0a38a977ce92',
          mediaUrl: 'https://test_url.crypto/ep2.mp3',
          mediaType: 'audio/mpeg',
          mediaLength: '12345678',
          duration: '02:02',
          imageUrl: 'https://test_url.crypto/ep2image.jpeg',
          imageTitle: 'Specific imageTitle',
          categories: ['ep2cat'],
          keywords: ['ep2key'],
        },
        {
          title: 'Ep3 title',
          publishedAt: new Date(ep3date),
        },
      ],
      keywords: ['podcast author', 'key1', 'key2'],
      categories: ['cat1', 'cat2', 'subcat1', 'subcat2'],
      subtitle: 'Podcast subtitle',
      description: 'Podcast description',
      summary: 'Podcast summary',
      infoUrl: 'https://test_url.crypto/info',
      imageUrl: 'https://test_url.crypto/podcast.jpeg',
      imageTitle: 'My imageTitle',
      language: 'en',
      explicit: 'no',
      author: 'Podcast author',
      ownerName: 'Podcast owner',
      ownerEmail: 'mail@test_url.crypto',
      copyright: 'Podcast copyright',
      managingEditor: 'Podcast editor',
      lastBuildDate: new Date(podcastDate),
      episodesKeywords: ['ep1key1', 'ep1key2', 'ep2key'],
    };

    it('returns a formatted Podcast object with 3 episodes', async () => {
      const mockFeed = { ...COMPLETE_PODCAST, items: EPISODES };
      parser.parseURL.mockResolvedValue(mockFeed);

      const result = await getPodcastFeed(FEED_URL);
      expect(result).toEqual(expected);
    });

    describe('When using alternate fields and feed.itunes is empty', () => {
      it('returns the same formatted Podcast object except for itunes subcategories', async () => {
        const mockFeed = { ...COMPLETE_PODCAST_NO_ITUNES, items: EPISODES };
        parser.parseURL.mockResolvedValue(mockFeed);

        const result = await getPodcastFeed(FEED_URL);
        expect(result).toEqual({ ...expected, categories: ['cat1', 'cat2'] });
      });
    });
  });

  describe('With a minimal podcast feed with 1 minimal episode', () => {
    it('returns a formatted Podcast object', async () => {
      const mockFeed = { ...MINIMAL_PODCAST, items: [MINIMAL_EPISODE_3] };
      parser.parseURL.mockResolvedValue(mockFeed);

      const result = await getPodcastFeed(FEED_URL);
      expect(result).toEqual({
        subscribeUrl: 'https://test_url.crypto/rss',
        title: 'My podcast',
        episodes: [
          {
            title: 'Ep3 title',
            publishedAt: new Date(ep3date),
          },
        ],
        keywords: ['my podcast'],
      });
    });
  });

  describe('Error handling', () => {
    describe('With a podcast feed without title', () => {
      it('returns an error message object', async () => {
        const mockFeed = { title: '', items: EPISODES };
        parser.parseURL.mockResolvedValue(mockFeed);

        await expect(getPodcastFeed(FEED_URL)).resolves
          .toMatchObject({ errorMessage: expect.stringMatching(/'title' is empty/) });
      });
    });

    describe('With a podcast feed without valid episodes', () => {
      it('returns an error message object (no episodes)', async () => {
        const mockFeed = { title: 'Title' };
        parser.parseURL.mockResolvedValue(mockFeed);

        await expect(getPodcastFeed(FEED_URL)).resolves
          .toMatchObject({ errorMessage: expect.stringMatching(/'episodes' is empty/) });
      });

      it('returns an error message object (invalid episodes)', async () => {
        const mockFeed = { title: 'Title', items: [INVALID_EPISODE_4] };
        parser.parseURL.mockResolvedValue(mockFeed);

        await expect(getPodcastFeed(FEED_URL)).resolves
          .toMatchObject({ errorMessage: expect.stringMatching(/'episodes' is empty/) });
      });
    });

    describe('When the RSS Parser throws an error', () => {
      it('returns an error message object', async () => {
        const mockError = new Error('Parser Error');
        parser.parseURL.mockRejectedValue(mockError);

        await expect(getPodcastFeed(FEED_URL)).resolves
          .toMatchObject({ errorMessage: expect.stringMatching(/Parser Error/) });
      });
    });
  });
});
