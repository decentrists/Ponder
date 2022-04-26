import * as arweave from './arweave';
import * as rss from './rss';
import { findMetadata, hasMetadata } from '../utils';
import { mergeBatchMetadata, simpleDiff, rightDiff } from './arweave/sync/diff-merge-logic';

async function fetchFeeds(subscribeUrl) {
  const [arweaveFeed, rssFeed] = await Promise.all([
    arweave.getPodcastFeed(subscribeUrl),
    rss.getPodcastFeed(subscribeUrl),
  ]);
  return {
    arweave: arweaveFeed,
    rss: rssFeed,
  };
}

export async function getPodcast(subscribeUrl, metadataToSync = []) {
  const feed = await fetchFeeds(subscribeUrl);
  if (feed.arweave.errorMessage) {
    return { errorMessage: feed.arweave.errorMessage };
  }
  if (feed.rss.errorMessage && !hasMetadata(feed.arweave)) {
    return { errorMessage: feed.rss.errorMessage };
  }
  // else: we do want to update the subscription if RSS fails but Arweave has metadata

  const rssDiffnewToArweave = simpleDiff(feed.arweave, feed.rss);
  const currentPodcastMetadataToSync = findMetadata(subscribeUrl, metadataToSync);

  // Here we do want currentPodcastMetadataToSync to override each field of the rssDiffnewToArweave,
  // since in the previous refresh, currentPodcastMetadataToSync was assigned
  // the diff from feed.arweave to metadataToSyncWithNewEpisodes.
  const metadataToSyncWithNewEpisodes =
    mergeBatchMetadata([rssDiffnewToArweave, currentPodcastMetadataToSync], false);

  const newPodcastMetadata =
    mergeBatchMetadata([feed.arweave, metadataToSyncWithNewEpisodes], true);
  const newPodcastMetadataToSync = rightDiff(feed.arweave, metadataToSyncWithNewEpisodes);

  return { newPodcastMetadata, newPodcastMetadataToSync };
}

export async function refreshSubscriptions(subscriptions, metadataToSync = []) {
  const errorMessages = [];
  const newSubscriptions = [];
  const newMetadataToSync = [];
  const getPodcastResults = await Promise.all(
    subscriptions.map(subscription => getPodcast(subscription.subscribeUrl, metadataToSync)),
  );

  getPodcastResults.forEach((result, index) => {
    const { errorMessage, newPodcastMetadata, newPodcastMetadataToSync } = result;
    const subscription = subscriptions[index];

    if (hasMetadata(newPodcastMetadata)) {
      newSubscriptions.push(newPodcastMetadata);
      if (hasMetadata(newPodcastMetadataToSync)) newMetadataToSync.push(newPodcastMetadataToSync);
    }
    else {
      const oldPodcastMetadataToSync = findMetadata(subscription.subscribeUrl, metadataToSync);

      if (errorMessage) {
        errorMessages.push(`${subscription.title} failed to refresh due to:\n${errorMessage}`);
      }
      newSubscriptions.push(subscription);
      if (hasMetadata(oldPodcastMetadataToSync)) newMetadataToSync.push(oldPodcastMetadataToSync);
    }
  });

  return {
    errorMessages,
    newSubscriptions,
    newMetadataToSync,
  };
}
