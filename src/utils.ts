// TODO: group similar utils into separate modules, such as
// omitEmptyMetadata() --> src/client/metadata-filtering/utils

import {
  Episode,
  Podcast, 
} from './components/pod-graph/cytoscape/graph-logic/interfaces/interfaces';

export function unixTimestamp(date : Date | null = null) {
  return Math.floor(date ? date.getTime() : Date.now() / 1000);
}

export function toISOString(date: Date) {
  try {
    return date.toISOString();
  }
  catch (error) {
    return '';
  }
}

export function isValidInteger(number: number) {
  return typeof number === 'number' && Number.isInteger(number);
}

export function isValidDate(date: unknown) : date is Date {
  return date instanceof Date && !!date.getTime();
}

export function datesEqual(a: Date, b: Date) {
  return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
}

export type Primitive = string | boolean | number;

/**
 * @returns The given arrays, concatenated, omitting duplicate as well as falsy elements
 */
export function mergeArrays<T extends Primitive>(arr1: T[], arr2: T[]) {
  return [...new Set((arr1 || []).concat(arr2 || []))].filter(x => x);
}

/**
 * @param messages
 * @param  filterDuplicates
 * @returns 
 */
export function concatMessages(messages : string[] = [], filterDuplicates = false) {
  return (filterDuplicates ? [...new Set(messages.flat())] : messages.flat())
    .filter(x => x) // Filter out any null elements
    .join('\n').trim();
}

/**
 * @param date
 * @returns One of the following:
 *   - A new Date object, if `date` is a valid date string.
 *   - null, if `date` is not a valid date string.
 *   - `date`, if `date` is already a Date object.
 */
export function toDate(date: string | Date) {
  if (!date) return null;
  if (date instanceof Date) return date;

  const dateObj = new Date(date);
  return dateObj.getTime() ? dateObj : null;
}

/**
 * @param metadata
 * @returns true if `metadata` has specific metadata other than:
 *   `subscribeUrl`, `publishedAt` and an empty episodes list
 */
export function hasMetadata(metadata: Partial<Podcast>[] | 
Partial<Episode>[] |  Partial<Podcast> | Partial<Episode>) {
  if (!isNotEmpty(metadata)) return false;
  if (Array.isArray(metadata)) return true;
  if (metadata.title) return true;

  // @ts-ignore
  const { subscribeUrl, publishedAt, episodes, ...specificMetadata } = { ...metadata };
  if (episodes?.length) return true;

  return !!Object.values(specificMetadata).flat().filter(x => x).length;
}

export function findMetadata(subscribeUrl: string,
  arrayOfMetadata : Podcast[] = []) : Partial<Podcast> {
  return arrayOfMetadata.find(obj => isNotEmpty(obj) && obj.subscribeUrl === subscribeUrl) || {};
}

export function podcastWithDateObjects(podcast : Podcast, sortEpisodes = true) {
  const conditionalSort = (episodes: Episode[]) => (sortEpisodes ?
    episodes.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()) : episodes);
  const episodes = conditionalSort(
    (podcast.episodes || []).map(episode => ({
      ...episode,
      // TODO: probably this casting should be looked at because it may not be safe or correct.
      publishedAt: toDate(episode.publishedAt) as Date,
    })),
  );

  return Object.assign(
    { ...podcast, episodes },
    podcast.firstEpisodeDate ? { firstEpisodeDate: toDate(podcast.firstEpisodeDate) } : null,
    podcast.lastEpisodeDate ? { lastEpisodeDate: toDate(podcast.lastEpisodeDate) } : null,
  );
}

export function podcastsWithDateObjects(podcasts: Podcast[], sortEpisodes = true) {
  return podcasts.filter(podcast => isNotEmpty(podcast))
    .map(podcast => podcastWithDateObjects(podcast, sortEpisodes));
}

/**
 * @param metadata
 * @returns The `metadata` exluding props where !valuePresent(value), @see valuePresent
 */
export function omitEmptyMetadata(metadata : Partial<Podcast>) {
  if (!isNotEmpty(metadata)) return {};
  
  let result : Partial<Podcast> = {};
  Object.entries(metadata).forEach(([prop, value]) => {
    let newValue = value;
    // @ts-ignore
    if (Array.isArray(newValue)) newValue = newValue.filter(elem => valuePresent(elem));
    if (valuePresent(newValue)) result = { ...result, [prop]: newValue };
  });

  return result;
}

/**
 * @param value
 * @returns false iff `value` comprises one of these values:
 *   - null
 *   - undefined
 *   - NaN
 *   - an empty string
 *   - an empty array
 *   - an empty object (non-recursively)
 *   - an array comprised of only any of the above elements
 */
export function valuePresent(value: number | string | object) : boolean {
  switch (typeof value) {
    case 'number':
      return !Number.isNaN(value);
    case 'string':
      return !!value.trim();
    case 'object':
      if (Array.isArray(value)) return isNotEmpty(value.filter(elem => valuePresent(elem)));
      if (value instanceof Date) return isValidDate(value);

      return isNotEmpty(value);
    default:
      return !!value;
  }
}

/**
 * 
 * @param obj is an object that might be empty/undefined
 * @returns true if the given array or object is not empty
 */
export function isNotEmpty<T extends object>(obj: T | undefined | null | {}) : obj is T {
  const isEmpty = !obj || typeof obj !== 'object' || Object.keys(obj).length === 0;
  return !isEmpty;
}

/* Returns true if the given objects' values are (deep)equal */
export function valuesEqual(a : object = {}, b : object = {}) : boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  // See https://stackoverflow.com/a/32922084/8691102
  const ok = Object.keys, tx = typeof a, ty = typeof b;
  return tx === 'object' && tx === ty ? (
    ok(a).length === ok(b).length 
    && ok(a).every(key => valuesEqual(a[key as keyof typeof a], b[key as keyof typeof b]))
  ) : (a === b);
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

export function withCorsProxy(url: string) {
  return corsProxyURL() + url;
}
