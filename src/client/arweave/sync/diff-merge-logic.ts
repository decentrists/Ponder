import {
  Episode,
  Podcast,
  PodcastTags,
} from '../../interfaces';
import {
  isNotEmpty,
  toDate,
  isValidDate,
  datesEqual,
  hasMetadata,
  valuePresent,
  omitEmptyMetadata,
  Primitive,
} from '../../../utils';
import { mergeArraysToLowerCase } from '../../metadata-filtering';

/**
 * @param oldEpisode
 * @param newEpisode
 * @returns The merged episodes metadata, where newer non-empty properties of duplicate
 *   episodes take precedence, except for categories and keywords, which are merged.
 */
function mergeEpisodeMetadata(oldEpisode: Partial<Episode>, newEpisode: Partial<Episode>) {
  let result : Partial<Episode> = { ...oldEpisode };

  Object.entries(newEpisode).forEach(([prop, value]) => {
    let newValue = value;
    if (Array.isArray(newValue)) newValue = mergeArraysToLowerCase(
      oldEpisode[prop as keyof Episode] as string[], newValue,
    );

    if (valuePresent(newValue)) result = { ...result, [prop]: newValue };
  });

  return result;
}

type PartialEpisodeWithDate = Partial<Episode> & Pick<Episode, 'publishedAt'>;

/**
 * @param oldEpisodes assumed-DATE_DESC-sorted array of episodes metadata
 * @param newEpisodes assumed-DATE_DESC-sorted array of newer episodes metadata
 * @returns An array of merged episodes metadata, where newer properties of
 *   duplicate episodes take precedence, except for categories and keywords, which are merged.
 */
function mergeEpisodesMetadata(oldEpisodes: PartialEpisodeWithDate[],
  newEpisodes: PartialEpisodeWithDate[]) : PartialEpisodeWithDate[] {
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
  const duplicateNewEpisodeIndices : number[] = [];

  // Use a minimal for-loop for reduced computational complexity
  for (let oldEpisodeIndex = 0; oldEpisodeIndex < oldEpisodes.length; oldEpisodeIndex++) {
    const oldEpisode = oldEpisodes[oldEpisodeIndex];
    if (oldEpisode.publishedAt < oldestNewEpisodeDate) {
      // Since we loop from newest to oldest oldEpisode, we can break at this point
      break;
    }

    const duplicateNewEpisodeIndex = newEpisodes
      .findIndex(newEpisode => newEpisode.publishedAt.getTime()
      - oldEpisode.publishedAt.getTime() === 0);
    if (duplicateNewEpisodeIndex >= 0) {
      duplicateNewEpisodeIndices.push(duplicateNewEpisodeIndex);
      const newEpisode = newEpisodes[duplicateNewEpisodeIndex];

      // Replace duplicate oldEpisode with merged episode metadata
      oldEpisodesWithMerges[oldEpisodeIndex] = mergeEpisodeMetadata(
        oldEpisode, newEpisode) as PartialEpisodeWithDate;
    }
  }
  return newEpisodes
    .filter((_, index) => !duplicateNewEpisodeIndices.includes(index))
    .concat(oldEpisodesWithMerges)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

/**
 * @param episodeBatches
 * @returns
 */
export function mergeEpisodeBatches(episodeBatches: PartialEpisodeWithDate[][]) {
  return episodeBatches.reduce((mergedEps, batch) => mergeEpisodesMetadata(mergedEps, batch), []);
}

/**
 * NOTE: for the getPodcastFeed() caller, podcast categories & keywords are still in the tags,
 * outside of this scope. Other use cases may want to enable `applyMergeSpecialTags` or refactor.
 * @param metadataBatches
 * @param applyMergeSpecialTags
 *   - If false, each non-empty metadatum of newer batches overrides the value from prior batches.
 *     @see omitEmptyMetadata
 *   - If true, the following additional exceptions apply: @see mergeSpecialTags
 * @returns A new object with merged podcast metadata, where newer batches take precedence
 *   (read above for exceptions) and episodes are merged by @see mergeEpisodeBatches
 */
export function mergeBatchMetadata(metadataBatches: Partial<Podcast>[]
  , applyMergeSpecialTags = false) : Podcast | {} {
  if (!isNotEmpty(metadataBatches) ||
    metadataBatches.every(batch => !hasMetadata(batch))) return {};

  const mergedEpisodes = mergeEpisodeBatches(metadataBatches.map(batch => batch.episodes || []));
  return {
    ...metadataBatches.reduce((acc, batch) => {
      if (applyMergeSpecialTags) return mergeSpecialTags(acc, batch);
      // else: stack the non-empty metadata from newer batches on top of the acc metadata
      return { ...acc, ...omitEmptyMetadata(batch) };
    }, {}),
    episodes: mergedEpisodes,
  };
}

/**
 * Helper function to run in the body of a reduce operation on an array of objects.
 * @param acc
 * @param metadata
 * @returns
 *   `acc` with all non-empty tags merged, where newer batches take precedence, except for:
 *   - min holds for firstEpisodeDate
 *   - max holds for lastEpisodeDate and metadataBatch
 *   - metadataBatch maps to an Integer
 *   - both categories and keywords are merged
 *     NOTE: pending T251, removal of certain categories and keywords can still be accomplished
 *           by omitting the (e.g. downvoted) tx.id in preselection of GraphQL results.
 */
const mergeSpecialTags = (acc: Partial<PodcastTags>, metadata: Partial<PodcastTags>) => {
  Object.entries(omitEmptyMetadata(metadata)).forEach(([tag, value]) => {
    switch (tag) {
      case 'episodes':
        break;
      case 'firstEpisodeDate':
        if (!acc.firstEpisodeDate || value < acc.firstEpisodeDate)
          acc.firstEpisodeDate = toDate(value as string | Date);
        break;
      case 'lastEpisodeDate':
        if (!acc.lastEpisodeDate || value > acc.lastEpisodeDate)
          acc.lastEpisodeDate = toDate(value as string | Date);
        break;
      case 'metadataBatch':
        acc.metadataBatch = Math.max(acc.metadataBatch || 0, parseInt(value as string, 10));
        break;
      case 'categories':
      case 'keywords':
      case 'episodesKeywords':
        acc[tag as 'categories' | 'keywords' | 'episodesKeywords'] =
          mergeArraysToLowerCase(acc[tag] || [], value as string[]);
        break;
      default:
        acc = { ...acc, [tag]: value };
    }
  });
  return acc;
};

/**
 * @param tagBatches
 * @returns A new object with all tags merged, where newer batches take precedence;
 *   @see mergeSpecialTags for exceptions.
 */
export function mergeBatchTags(tagBatches: PodcastTags[]) {
  const initialAcc : Partial<PodcastTags> = {};
  return tagBatches.reduce((acc, batch) => mergeSpecialTags(acc, batch), initialAcc);
}

function episodesRightDiff(oldEpisodes : Episode[] = [], newEpisodes : Episode[] = []) {
  const result : PartialEpisodeWithDate[] = [];
  newEpisodes.forEach(newEpisode => {
    const oldEpisodeMatch =
      oldEpisodes.find(oldEpisode => datesEqual(oldEpisode.publishedAt, newEpisode.publishedAt));
    if (oldEpisodeMatch) {
      const diff = rightDiff(oldEpisodeMatch, newEpisode, ['publishedAt']);
      if (hasMetadata(diff)) result.push(diff as PartialEpisodeWithDate);
    }
    else {
      result.push(newEpisode);
    }
  });
  return result.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

function arrayRightDiff<T extends Primitive>(oldArray : T[] = [], newArray : T[] = []) {
  return newArray.filter(x => x && !oldArray.includes(x));
}

/**
 * @param oldMetadata
 * @param newMetadata
 * @param persistentMetadata
 *   Metadata props to survive the diff iff hasMetadata(diff) == true.
 *   TODO: pending T244, change to 'id'.
 * @returns The newMetadata omitting each { prop: value } already present in oldMetadata
 */
export function rightDiff<T extends Partial<Episode> | Partial<Podcast>>(oldMetadata : T,
  newMetadata : T, persistentMetadata = ['subscribeUrl']) : Partial<T> {
  if (!hasMetadata(oldMetadata)) return newMetadata;
  if (!hasMetadata(newMetadata)) return {} as T;

  let result : Partial<T> = {};
  Object.entries(newMetadata).forEach(([prop, value]) => {
    const oldValue = oldMetadata[prop as keyof T];

    switch (prop) {
      case 'firstEpisodeDate':
      case 'lastEpisodeDate':
      case 'metadataBatch':
        // These should be excluded from the diff, as they are recomputed in their relevant context
        break;
      case 'episodes':
        // @ts-ignore
        const episodesDiff = episodesRightDiff(oldValue, value);
        if (hasMetadata(episodesDiff)) result = { ...result, episodes: episodesDiff };
        break;
      default:
        if (Array.isArray(value)) {
          const arrayDiff = arrayRightDiff<string>(oldValue as any, value);
          if (arrayDiff.length) result = { ...result, [prop]: arrayDiff };
        }
        else if (isValidDate(value) && isValidDate(oldValue)) {
          if (!datesEqual(value, oldValue)) result = { ...result, [prop]: value };
        }
        else if (value !== oldValue && valuePresent(value)) result = { ...result, [prop]: value };
    }

  });

  if (hasMetadata(result) && valuePresent(persistentMetadata)) {
    persistentMetadata.forEach(prop => {
      result = {
        ...result,
        [prop]: newMetadata[prop as keyof T] || oldMetadata[prop as keyof T],
      };
    });
  }
  return result;
}

/**
 * @param oldMetadata
 * @param newMetadata
 * @returns The newMetadata omitting episodes whose timestamps exist in oldMetadata.
 *   If there are no new episodes, return an empty metadata object: { episodes: [] }
 */
export function simpleDiff(oldMetadata: Partial<Podcast>, newMetadata: Partial<Podcast>) {
  const emptyDiff = { episodes: [] };
  if (!hasMetadata(oldMetadata)) return { ...emptyDiff, ...newMetadata };
  if (!hasMetadata(newMetadata)) return emptyDiff;

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
