import { toTag, fromTag } from '../utils';

const originalTagPrefix = process.env.TAG_PREFIX;
const testTag = 'testPonder';

beforeAll(() => {
  Object.assign(process.env, { TAG_PREFIX: testTag });
});

afterAll(() => {
  process.env.TAG_PREFIX = originalTagPrefix;
});

describe('toTag, fromTag', () => {
  it('toTag() prepends tag prefix to name', () => {
    expect(toTag('foo')).toBe('testPonder-foo');
  });

  it('fromTag() removes prepending prefix to name', () => {
    expect(fromTag(toTag('foo'))).toBe('foo');
  });

  xdescribe('sanity checks', () => {
    afterEach(() => {
      Object.assign(process.env, { TAG_PREFIX: testTag });
    });

    it('raises an error if the TAG_PREFIX is empty', () => {
      Object.assign(process.env, { TAG_PREFIX: '' });
      expect(() => toTag('foo')).toThrow();
      expect(() => fromTag('foo')).toThrow();
    });

    it('raises an error if the TAG_PREFIX is undefined', () => {
      Object.assign(process.env, { TAG_PREFIX: undefined });
      expect(() => toTag('foo')).toThrow();
      expect(() => fromTag('undefined-foo')).toThrow();
    });
  });
});
