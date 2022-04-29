import { Podcast } from '../interfaces';

/**
 * @param metadata sanitized metadata
 * @returns {Array.<string>}
 *   An array with one keyword generated from `metadata` or an empty array if not generable
 */
export function initializeKeywords(metadata : Partial<Podcast>) : string[] {
  const firstCategory = metadata.author || metadata.ownerName;
  return firstCategory ? [firstCategory] : [];
}
