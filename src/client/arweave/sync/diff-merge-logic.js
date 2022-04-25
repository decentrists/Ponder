import { isEmpty, toDate, mergeArrays } from '../../../utils';

const cloneDeep = require('lodash.clonedeep');

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

/**
 * @param {Object} oldMetadata
 * @param {Object} newMetadata
 * @returns {Object} The newMetadata omitting episodes whose timestamps exist in oldMetadata.
 *   If there are no new episodes, return an empty metadata object: { episodes: [] }
 */
export function simpleDiff(oldMetadata, newMetadata) {
  const emptyDiff = { episodes: [] };
  if (isEmpty(oldMetadata)) return { ...emptyDiff, ...newMetadata };
  if (isEmpty(newMetadata)) return emptyDiff;

  const oldEpisodeTimestamps =
    (oldMetadata.episodes || []).map(episode => episode.publishedAt.getTime());
  const newEpisodes = (newMetadata.episodes || [])
    .filter(newEpisode => !oldEpisodeTimestamps.includes(newEpisode.publishedAt.getTime()));

  if (newEpisodes.length) {
    return {
      ...newMetadata,
      episodes: newEpisodes,
    };
  }
  return emptyDiff;
}