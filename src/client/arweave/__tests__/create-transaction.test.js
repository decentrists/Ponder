import { advanceTo } from 'jest-date-mock';
import { createPodcast } from '../create-transaction';
// eslint-disable-next-line import/named
import { addTag, createTransaction } from '../client';

jest.mock('../client');

const BASE_PODCAST = {
  subscribeUrl: 'https://example.com/foo',
  title: 'Example Podcast',
  description: 'Literally an example',
  imageUrl: 'https://image.simplecastcdn.com/images/5b7d8c77-15ba-4eff-a999-2e725db21db5/2ca29cb6-c010-4780-a9ba-7e5e1729f565/3000x3000/conaf-cover.jpg?aid=rss_feed',
  imageTitle: 'Conan O’Brien Needs A Friend',
  language: 'en-us',
  keywords: [],
  categories: [],
};

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

describe('createPodcast', () => {
  test('Bare bones', async () => {
    expect(createTransaction).not.toHaveBeenCalled();
    expect(addTag).not.toHaveBeenCalled();

    await createPodcast(stubbedWallet, BASE_PODCAST);

    expect(createTransaction).toHaveBeenCalledWith({
      data: JSON.stringify({
        title: 'Example Podcast',
        description: 'Literally an example',
        imageUrl: 'https://image.simplecastcdn.com/images/5b7d8c77-15ba-4eff-a999-2e725db21db5/2ca29cb6-c010-4780-a9ba-7e5e1729f565/3000x3000/conaf-cover.jpg?aid=rss_feed',
        imageTitle: 'Conan O’Brien Needs A Friend',
        language: 'en-us',
      }),
    }, stubbedWallet);

    expect(addTag).toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(addTag).toHaveBeenCalledWith('Unix-Time', Math.floor(Date.now() / 1000));
    expect(addTag).toHaveBeenCalledWith('abc-version', 'testVersion');
    expect(addTag).toHaveBeenCalledWith('abc-subscribeUrl', 'https://example.com/foo');
    expect(addTag).toHaveBeenCalledWith('abc-title', 'Example Podcast');
    expect(addTag).toHaveBeenCalledWith('abc-description', 'Literally an example');
    expect(addTag).not.toHaveBeenCalledWith('abc-category');
    expect(addTag).not.toHaveBeenCalledWith('abc-keyword');
  });

  test('Categories and keywords', async () => {
    expect(createTransaction).not.toHaveBeenCalled();
    expect(addTag).not.toHaveBeenCalled();

    await createPodcast(stubbedWallet, {
      ...BASE_PODCAST,
      categories: ['a', 'b', 'c'],
      keywords: ['x', 'y', 'z'],
    });

    expect(createTransaction).toHaveBeenCalledWith({
      data: JSON.stringify({
        title: 'Example Podcast',
        description: 'Literally an example',
        imageUrl: 'https://image.simplecastcdn.com/images/5b7d8c77-15ba-4eff-a999-2e725db21db5/2ca29cb6-c010-4780-a9ba-7e5e1729f565/3000x3000/conaf-cover.jpg?aid=rss_feed',
        imageTitle: 'Conan O’Brien Needs A Friend',
        language: 'en-us',
      }),
    }, stubbedWallet);

    expect(addTag).toHaveBeenCalledWith('abc-category', 'a');
    expect(addTag).toHaveBeenCalledWith('abc-category', 'b');
    expect(addTag).toHaveBeenCalledWith('abc-category', 'c');
    expect(addTag).toHaveBeenCalledWith('abc-keyword', 'x');
    expect(addTag).toHaveBeenCalledWith('abc-keyword', 'y');
    expect(addTag).toHaveBeenCalledWith('abc-keyword', 'z');
  });
});
