import { Podcast, PodcastDTO } from '../interfaces';
import { mergeArraysToLowerCase } from '.';
import { valueToLowerCase } from '../../utils';

/**
 * @param metadata sanitized metadata
 * @returns A keyword comprising the podcast author name or an empty string if not generable
 */
function getPrimaryKeyword(metadata : Partial<Podcast> | Partial<PodcastDTO>) : string {
  const primaryKeyword = metadata.author || metadata.ownerName;
  return valueToLowerCase(primaryKeyword);
}

/**
 * @param metadata sanitized metadata
 * @param keywords existing keywords
 * @returns {Array.<string>} A filtered array of `keywords` with an additional primary keyword
 */
export function initializeKeywords(metadata : Partial<Podcast> | Partial<PodcastDTO>,
  keywords: string[] = []) : string[] {

  const primaryKeyword = getPrimaryKeyword(metadata);
  // Sometimes iTunes has keywords ['jimmy', 'dore', ...]; merge these with `primaryKeyword`
  const duplicateKeywords = primaryKeyword.split(' ');

  return mergeArraysToLowerCase([primaryKeyword], keywords)
    .filter(keyword => !duplicateKeywords.includes(keyword));
}
