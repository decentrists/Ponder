// TODO: group similar utils into separate modules, such as
// omitEmptyMetadata() --> src/client/metadata-filtering/utils

import {
  Episode,
  Podcast,
  PodcastDTO,
  PodcastFeedError,
} from './client/interfaces';
import { initializeKeywords } from './client/metadata-filtering/generation';

export function unixTimestamp(date : Date | null = null) {
  return Math.floor(date ? date.getTime() : Date.now() / 1000);
}

export function addLastMutatedAt(subscription: Podcast) : Podcast {
  return { ...subscription, lastMutatedAt: unixTimestamp() };
}

export function toISOString(date: Date) {
  try {
    return date.toISOString();
  }
  catch (error) {
    return '';
  }
}

export function valueToLowerCase(value: any) : string {
  return typeof value === 'string' ? value.toLowerCase() : '';
}

export function isValidString(str: unknown) : str is string {
  return typeof str === 'string' && !!str.trim().length;
}

export function isValidInteger(number: unknown) : number is number {
  return typeof number === 'number' && Number.isInteger(number);
}

export function isValidDate(date: unknown) : date is Date {
  return date instanceof Date && !!date.getTime();
}

export function datesEqual(a: Date, b: Date) {
  return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
}

export type Primitive = string | boolean | number;

export type EmptyTypes = null | undefined | {};

export function episodesCount(metadata: Partial<Podcast>) : number {
  return isNotEmpty(metadata.episodes) ? metadata.episodes.length : 0;
}

export function getFirstEpisodeDate(metadata: Partial<Podcast>) : Date {
  if (!episodesCount(metadata)) return new Date(0);

  const result = metadata.episodes![metadata.episodes!.length - 1].publishedAt;
  return isValidDate(result) ? result : new Date(0);
}

export function getLastEpisodeDate(metadata: Partial<Podcast>) : Date {
  if (!episodesCount(metadata)) return new Date(0);

  const result = metadata.episodes![0].publishedAt;
  return isValidDate(result) ? result : new Date(0);
}

/**
 * @param messages
 * @param filterDuplicates
 * @returns The `messages` concatenated by '\n'
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
 *   - A 0 Date object, if `date` is not a valid date string.
 *   - `date`, if `date` is already a Date object.
 */
export function toDate(date: string | Date | undefined) : Date {
  if (!date) return new Date(0);
  if (date instanceof Date) return date;

  const dateObj = new Date(date);
  return dateObj.getTime() ? dateObj : new Date(0);
}

/**
 * @param metadata
 * @returns true if `metadata` has specific metadata other than:
 *   `subscribeUrl`, `publishedAt`, `lastMutatedAt` and an empty episodes list
 */
export function hasMetadata<T extends Partial<Podcast>[] | Partial<Episode>[],
K extends Partial<Podcast> | Partial<Episode>>(metadata: K | T | EmptyTypes) : metadata is T | K {

  if (!isNotEmpty(metadata)) return false;
  if (Array.isArray(metadata)) return true;
  if (metadata.title) return true;

  // @ts-ignore
  const { subscribeUrl, publishedAt, lastMutatedAt, episodes, ...specificMetadata } = {
    ...metadata,
  };
  if (episodes?.length) return true;

  return !!Object.values(specificMetadata).flat().filter(x => x).length;
}

export function findMetadata(subscribeUrl: Podcast['subscribeUrl'],
  arrayOfMetadata: Partial<Podcast>[] = []) : Partial<Podcast> {
  return arrayOfMetadata.find(obj => isNotEmpty(obj) && obj.subscribeUrl === subscribeUrl) || {};
}

export function partialToPodcast(partialMetadata: Partial<Podcast>) : Podcast | PodcastFeedError {
  const result : Podcast = {
    ...partialMetadata,
    subscribeUrl: partialMetadata.subscribeUrl || '',
    title: partialMetadata.title || '',
  };

  if (!result.subscribeUrl) return { errorMessage: 'Feed URL is missing.' };
  if (!result.title) return { errorMessage: `Feed ${result.subscribeUrl} is missing a title.` };

  return result;
}

export function podcastFromDTO(podcast : PodcastDTO, sortEpisodes = true) : Podcast {
  const conditionalSort = (episodes: PodcastDTO['episodes']) => (sortEpisodes ?
    episodes.sort((a, b) => new Date(b.publishedAt).getTime()
     - new Date(a.publishedAt).getTime()) : episodes);

  const episodes : Podcast['episodes'] = conditionalSort(
    (podcast.episodes || [])).map(episode => ({
    ...episode,
    publishedAt: toDate(episode.publishedAt),
  }),
  );

  return ({
    ...podcast,
    keywords: initializeKeywords(podcast, podcast.keywords),
    episodes,
    metadataBatch: Number(podcast.metadataBatch),
    firstEpisodeDate: toDate(podcast.firstEpisodeDate),
    lastEpisodeDate: toDate(podcast.lastEpisodeDate),
    lastBuildDate: toDate(podcast.lastBuildDate),
  });
}

export function podcastsFromDTO(podcasts: PodcastDTO[], sortEpisodes = true) {
  return podcasts.filter(podcast => isNotEmpty(podcast))
    .map(podcast => podcastFromDTO(podcast, sortEpisodes));
}

/**
 * @param metadata
 * @returns The `metadata` exluding props where !valuePresent(value), @see valuePresent
 */
export function omitEmptyMetadata(metadata : Partial<Podcast> | Partial<Episode>) {
  if (!isNotEmpty(metadata)) return {};

  let result : Partial<Podcast> | Partial<Episode> = {};
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
 * @param obj is an object that might be empty/undefined
 * @returns true if the given array or object is not empty
 */
export function isNotEmpty<T extends object>(obj: T | EmptyTypes) : obj is T {
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
  // return 'https://corsanywhere.herokuapp.com/';
  return 'https://cors-anywhere.herokuapp.com/';
}

export function withCorsProxy(url: string) {
  return corsProxyURL() + url;
}
