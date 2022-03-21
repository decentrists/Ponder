import * as arweave from './arweave';
import * as rss from './rss';
import { episodeId, isEmpty } from '../utils';

export { createPodcast } from './arweave';

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

function feedDiff(feed) {
  if (isEmpty(feed.arweave)) {
    return feed.rss.episodes;
  }
  if (isEmpty(feed.rss)) {
    return feed.arweave.episodes;
  }

  const existingIds = feed.arweave.episodes.map(episodeId);
  return feed.rss.episodes.filter(episode => !existingIds.includes(episodeId(episode)));
}

function mergeFeed(subscribeUrl, feed) {
  const newEpisodes = feedDiff(feed);

  if (!newEpisodes.length) {
    const toSync = JSON.parse(localStorage.getItem('toSync')) || [];
    const newValue = toSync.podcasts.map(podcast => (
      subscribeUrl !== podcast.subscribeUrl ? podcast : {
        ...podcast,
        episodes: podcast.episodes
          .concat(newEpisodes)
          .sort((a, b) => b.publishedAt - a.publishedAt),
      }
    ));
    localStorage.setItem('toSync', JSON.stringify(newValue));
    console.log('toSync', toSync);
  }

  return {
    ...feed.arweave,
    ...feed.rss,
    episodes: (feed.arweave?.episodes || [])
      .concat(newEpisodes)
      .sort((a, b) => b.publishedAt - a.publishedAt),
  };
}

export async function getPodcast(subscribeUrl) {
  return mergeFeed(subscribeUrl, await fetchFeeds(subscribeUrl));
}

export async function getAllPodcasts(subscriptions) {
  return Promise.all(subscriptions
    .map(subscription => fetchFeeds(subscription.subscribeUrl)
      .then(feed => mergeFeed(subscription.subscribeUrl, feed))));
}
