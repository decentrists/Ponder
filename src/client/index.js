import * as arweave from './arweave';
import * as rss from './rss';
import { simpleDiff } from './arweave/sync/diff-merge-logic';

async function fetchFeeds(subscribeUrl) {
  const [arweaveFeed, rssFeed] = await Promise.all([
    arweave.getPodcastFeed(subscribeUrl),
    rss.getPodcastFeed(subscribeUrl),
  ]);
  // console.log('arweaveFeed', arweaveFeed);
  // console.log('rssFeed', rssFeed);
  return {
    arweave: arweaveFeed,
    rss: rssFeed,
  };
}

function mergeFeed(subscribeUrl, feed) {
  const rssDiffnewToArweave = simpleDiff(feed.arweave, feed.rss);
  return {
    ...feed.arweave,
    ...feed.rss,
    episodes: (feed.arweave?.episodes || [])
      .concat(rssDiffnewToArweave.episodes)
      .sort((a, b) => b.publishedAt - a.publishedAt),
  };
}

export async function getPodcast(subscribeUrl) {
  const feed = await fetchFeeds(subscribeUrl);
  return mergeFeed(subscribeUrl, feed);
}

export async function getAllPodcasts(subscriptions) {
  const newSubscriptions = await Promise.all(
    subscriptions.map(subscription => getPodcast(subscription.subscribeUrl)),
  );
  return newSubscriptions;
}
