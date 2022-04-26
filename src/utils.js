// TODO: group similar utils into separate modules, such as
// omitEmptyMetadata() --> src/client/metadata-filtering/utils

export function unixTimestamp(date = null) {
  return Math.floor(date ? date.getTime() : Date.now() / 1000);
}

export function toISOString(date) {
  try {
    return date.toISOString();
  }
  catch (error) {
    return '';
  }
}

export function isValidInteger(number) {
  return typeof number === 'number' && Number.isInteger(number);
}

export function isValidDate(date) {
  return date instanceof Date && !!date.getTime();
}

export function datesEqual(a, b) {
  return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
}

/**
 * @returns {Array} The given arrays, concatenated, omitting duplicate as well as falsy elements
 */
export function mergeArrays(arr1, arr2) {
  return [...new Set((arr1 || []).concat(arr2 || []))].filter(x => x);
}

/**
 * @param {Array.<string>} messages
 * @param {boolean} filterDuplicates
 * @returns {string}
 */
export function concatMessages(messages = [], filterDuplicates = false) {
  return (filterDuplicates ? [...new Set(messages.flat())] : messages.flat())
    .filter(x => x) // Filter out any null elements
    .join('\n').trim();
}

/**
 * @param {(string|Date)} date
 * @returns {(Date|null)} One of the following:
 *   - A new Date object, if `date` is a valid date string.
 *   - null, if `date` is not a valid date string.
 *   - `date`, if `date` is already a Date object.
 */
export function toDate(date) {
  if (!date) return null;
  if (date instanceof Date) return date;

  const dateObj = new Date(date);
  return dateObj.getTime() ? dateObj : null;
}

/**
 * @param {Object} metadata
 * @returns {boolean} true if `metadata` has specific metadata other than:
 *   `subscribeUrl`, `publishedAt` and an empty episodes list
 */
export function hasMetadata(metadata) {
  if (isEmpty(metadata)) return false;
  if (metadata.title) return true;

  const { subscribeUrl, publishedAt, episodes, ...specificMetadata } = { ...metadata };
  if (episodes?.length) return true;

  return !!Object.values(specificMetadata).flat().filter(x => x).length;
}

export function findMetadata(subscribeUrl, arrayOfMetadata = []) {
  return arrayOfMetadata.find(obj => !isEmpty(obj) && obj.subscribeUrl === subscribeUrl) || {};
}

export function podcastWithDateObjects(podcast, sortEpisodes = true) {
  const conditionalSort = episodes => (sortEpisodes ?
    episodes.sort((a, b) => b.publishedAt - a.publishedAt) : episodes);
  const episodes = conditionalSort(
    (podcast.episodes || []).map(episode => ({
      ...episode,
      publishedAt: toDate(episode.publishedAt),
    })),
  );

  return Object.assign(
    { ...podcast, episodes },
    podcast.firstEpisodeDate ? { firstEpisodeDate: toDate(podcast.firstEpisodeDate) } : null,
    podcast.lastEpisodeDate ? { lastEpisodeDate: toDate(podcast.lastEpisodeDate) } : null,
  );
}

export function podcastsWithDateObjects(podcasts, sortEpisodes = true) {
  return podcasts.filter(podcast => !isEmpty(podcast))
    .map(podcast => podcastWithDateObjects(podcast, sortEpisodes));
}

/**
 * @param {Object} metadata
 * @returns {Object} The `metadata` exluding props where !valuePresent(value), @see valuePresent
 */
export function omitEmptyMetadata(metadata = {}) {
  const result = {};
  Object.entries(metadata).forEach(([prop, value]) => {
    let newValue = value;
    if (Array.isArray(newValue)) newValue = newValue.filter(elem => valuePresent(elem));

    if (valuePresent(newValue)) result[prop] = newValue;
  });

  return result;
}

/**
 * @param {Object} metadata
 * @returns {Object} false iff `metadata` comprises one of these values:
 *   - null
 *   - undefined
 *   - NaN
 *   - an empty string
 *   - an empty array
 *   - an array comprised of only any of the above elements
 */
export function valuePresent(value) {
  switch (typeof value) {
    case 'number':
      return !Number.isNaN(value);
    case 'string':
      return !!value.trim();
    case 'object':
      if (Array.isArray(value)) return !isEmpty(value.filter(elem => valuePresent(elem)));
      if (value instanceof Date) return isValidDate(value);

      return !isEmpty(value);
    default:
      return !!value;
  }
}

/* Returns true if the given array or object is empty or not an object */
export function isEmpty(obj) {
  return !obj || typeof obj !== 'object' || Object.keys(obj).length === 0;
}

/* Returns true if the given arrays or objects' values are equal */
export function valuesEqual(a = {}, b = {}) {
  if (a === b) return true;
  if (!a || !b) return false;

  return (Object.values(a).every(x => b.includes(x)) &&
    Object.values(b).every(x => a.includes(x)));
}

export function corsApiHeaders() {
  switch (corsProxyURL()) {
    case 'https://cors.bridged.cc/':
      /* See: https://github.com/gridaco/base/issues/23 */
      return { 'x-cors-grida-api-key': 'MyAPIKey' };
    default:
      return {};
  }
}

export function corsProxyURL() {
  return 'https://corsanywhere.herokuapp.com/';
}

export function withCorsProxy(url) {
  return corsProxyURL() + url;
}
