import * as arweave from './arweave';
import * as rss from './rss';
import { isEmpty } from '../utils';

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

function feedDiff(feed) {
  if (isEmpty(feed.arweave)) return feed.rss.episodes;
  if (isEmpty(feed.rss)) return [];

  const arweaveEpisodeTimestamps =
    (feed.arweave.episodes || []).map(episode => episode.publishedAt.getTime());
  return feed.rss.episodes
    .filter(episode => !arweaveEpisodeTimestamps.includes(episode.publishedAt.getTime()));
}

function mergeFeed(subscribeUrl, feed) {
  const diff = feedDiff(feed);
  const newEpisodes = diff.episodes;
  // feed.diff = diff
  // feed.merge = merge
  // return feed;
  return {
    ...feed.arweave,
    ...feed.rss,
    episodes: (feed.arweave?.episodes || [])
      .concat(newEpisodes)
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

async function getPodcastDiff(subscription) {
  const feed = {
    arweave: await arweave.getPodcastFeed(subscription.subscribeUrl),
    rss: subscription,
  };
  console.log('arweaveFeed', feed.arweave);
  console.log('rssFeed', feed.rss);
  const diff = await feedDiff(feed);
  console.log('diff', diff);
  return diff;
}

// TODO: don't refresh arweave twice
export async function getAllPodcastDiffs(subscriptions) {
  const diffs = await Promise.all(
    subscriptions.map(subscription => getPodcastDiff(subscription)),
  );
  return diffs.filter(x => x);
}
