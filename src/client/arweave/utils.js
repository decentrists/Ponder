import { isEmpty, toDate } from '../../utils';

const cloneDeep = require('lodash.clonedeep');

const PLURAL_TAG_MAP = {
  category: 'categories',
  keyword: 'keywords',
};
const TAG_EXCLUDES = ['Content-Type', 'Unix-Time'];

// TODO: Move this check up the CI/CD pipeline
// function sanityCheckedTag() {
//   const tag = process.env.TAG_PREFIX;
//   if (!tag || tag === 'undefined' || tag === 'null') {
//    throw new Error('process.env.TAG_PREFIX is not set up. Please contact our development team.');
//   }
//   return tag;
// }

export function toTag(name) {
  return TAG_EXCLUDES.includes(name) ? name : `${process.env.TAG_PREFIX}-${name}`;
}

export function fromTag(tagName) {
  const a = tagName.replace(new RegExp(`^${process.env.TAG_PREFIX}-`), '');
  return PLURAL_TAG_MAP[a] || a;
}

/**
 * @returns {Array.<String>}
 *   The given arrays, concatenated, omitting duplicate as well as falsy elements */
const mergeArrays = (arr1, arr2) => [...new Set((arr1 || []).concat(arr2 || []))].filter(x => x);

/**
 * @param {Array.<Object>} oldEpisodes assumed-DATE_DESC-sorted array of episodes metadata
 * @param {Array.<Object>} newEpisodes assumed-DATE_DESC-sorted array of newer episodes metadata
 * @returns {Array.<Object>} An array of merged episodes metadata, where newer properties of
 *   duplicate episodes take precedence, except for categories and keywords, which are merged.
 */
function mergeEpisodesMetadata(oldEpisodes, newEpisodes) {
  // console.log('mergeEpisodesMetadata(oldEpisodes, newEpisodes)', [oldEpisodes, newEpisodes]);
  if (!oldEpisodes.length) return newEpisodes;
  if (!newEpisodes.length) return oldEpisodes;

  const newestNewEpisodeDate = newEpisodes[0].publishedAt;
  const oldestNewEpisodeDate = newEpisodes[newEpisodes.length - 1].publishedAt;
  const newestOldEpisodeDate = oldEpisodes[0].publishedAt;
  if (newestOldEpisodeDate > newestNewEpisodeDate) {
    return mergeEpisodesMetadata(newEpisodes, oldEpisodes);
  }

  // Don't attempt to merge duplicates if episode arrays don't overlap in Date
  if (newestOldEpisodeDate < oldestNewEpisodeDate) return newEpisodes.concat(oldEpisodes);

  const oldEpisodesWithMerges = oldEpisodes;
  const duplicateNewEpisodeIndices = [];

  // Use a minimal for-loop for reduced computational complexity
  for (let oldEpisodeIndex = 0; oldEpisodeIndex < oldEpisodes.length; oldEpisodeIndex++) {
    const oldEpisode = oldEpisodes[oldEpisodeIndex];
    if (oldEpisode.publishedAt < oldestNewEpisodeDate) {
      // Since we loop from newest to oldest oldEpisode, we can break at this point
      break;
    }

    const duplicateNewEpisodeIndex = newEpisodes
      .findIndex(newEpisode => newEpisode.publishedAt - oldEpisode.publishedAt === 0);
    if (duplicateNewEpisodeIndex >= 0) {
      duplicateNewEpisodeIndices.push(duplicateNewEpisodeIndex);
      const newEpisode = newEpisodes[duplicateNewEpisodeIndex];

      // Replace duplicate oldEpisode with merged episode metadata
      const categories = mergeArrays(oldEpisode.categories, newEpisode.categories);
      const keywords = mergeArrays(oldEpisode.keywords, newEpisode.keywords);
      oldEpisodesWithMerges[oldEpisodeIndex] = Object.assign(
        { ...oldEpisode, ...newEpisode },
        categories.length ? { categories } : null,
        keywords.length ? { keywords } : null,
      );
    }
  }
  // console.log('duplicateNewEpisodeIndices', duplicateNewEpisodeIndices);
  // console.log('oldEpisodesWithMerges', oldEpisodesWithMerges);
  return newEpisodes
    .filter((_, index) => !duplicateNewEpisodeIndices.includes(index))
    .concat(oldEpisodesWithMerges)
    .sort((a, b) => b.publishedAt - a.publishedAt);
}

/**
 * @param {Array.<Array.<Object>>} episodeBatches
 * @returns {Array.<Object>}
 */
export function mergeEpisodeBatches(episodeBatches) {
  if (episodeBatches.length < 2) return episodeBatches.flat();

  const episodeBatchesCopy = cloneDeep(episodeBatches);
  let mergedEpisodes = episodeBatchesCopy.shift();
  episodeBatchesCopy.forEach(currentBatch => {
    mergedEpisodes = mergeEpisodesMetadata(mergedEpisodes, currentBatch);
  });
  return mergedEpisodes;
}

/**
 * @param {Array.<Object>} metadataBatches
 * @returns {Object} A new object with merged podcast metadata, where newer batches take precedence
 *   and episodes are merged by @see mergeEpisodeBatches
 */
export function mergeBatchMetadata(metadataBatches) {
  if (!metadataBatches.length || isEmpty(metadataBatches[0])) return {};

  const mergedEpisodes = mergeEpisodeBatches(metadataBatches.map(batch => batch.episodes));
  // NOTE: at this point, podcast categories & keywords are still in the tags, outside of this scope
  const { episodes, ...mergedMetadata } = {
    ...metadataBatches.reduce((acc, batch) => ({ ...acc, ...batch })),
  };

  mergedMetadata.episodes = mergedEpisodes;
  return mergedMetadata;
}

/**
 * @param {Array.<Object>} tagBatches
 * @returns {Object} A new object with all tags merged, where newer batches take precedence, but:
 *   - min holds for firstEpisodeDate
 *   - max holds for lastEpisodeDate and metadataBatch
 *   - metadataBatch maps to an Integer
 *   - categories and keywords are merged (Note: removal of categories and keywords can be
 *     accomplished by omitting the (e.g. downvoted) trx.id in preselection of GraphQL results)
 */
export function mergeBatchTags(tagBatches) {
  // console.log('mergeBatchTags(tagBatches)', tagBatches);
  return tagBatches.reduce((acc, batch) => {
    Object.entries(batch).forEach(([tag, value]) => {
      switch (tag) {
        case 'firstEpisodeDate':
          if (!acc.firstEpisodeDate || value < acc.firstEpisodeDate) acc[tag] = toDate(value);
          break;
        case 'lastEpisodeDate':
          if (!acc.lastEpisodeDate || value > acc.lastEpisodeDate) acc[tag] = toDate(value);
          break;
        case 'metadataBatch':
          acc[tag] = Math.max(acc.metadataBatch || 0, parseInt(value, 10));
          break;
        case 'categories':
        case 'keywords':
          acc[tag] = mergeArrays(acc[tag] || [], value);
          break;
        default:
          acc[tag] = value;
      }
    });
    return acc;
  }, {});
}
