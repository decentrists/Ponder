import parser from './parser';
import { withCorsProxy } from '../../utils';

function mergeItunesData(items, itunes) {
  return (items || []).concat(itunes || [])
    .filter((a, i, xs) => xs.indexOf(a) === i)
    .map(a => a.toLowerCase());
}

export async function getPodcastFeed(subscribeUrl) {
  try {
    const { items, ...podcast } = await parser.parseURL(withCorsProxy(subscribeUrl));
    const imageUrl = podcast.image?.url || podcast.itunes?.image || null;
    return {
      subscribeUrl,
      title: podcast.title,
      description: podcast.description || podcast.itunes?.summary || null,
      imageUrl,
      imageTitle: podcast.image?.title || null,
      language: podcast.language || null,
      categories: mergeItunesData(podcast.categories, podcast.itunes?.categories),
      keywords: mergeItunesData(podcast.keywords, podcast.itunes?.keywords),
      episodes: (items || []).map(episode => {
        const publishedAt = episode.isoDate || episode.pubDate || null;
        return {
          title: episode.title,
          url: episode.enclosure?.url || episode.link || null,
          publishedAt: publishedAt ? new Date(publishedAt) : null,
          imageUrl: episode.image?.url || imageUrl,
          categories: mergeItunesData(episode.categories, episode.itunes?.categories),
          keywords: mergeItunesData(episode.keywords, episode.itunes?.keywords),
        };
      }),
    };
  }
  catch (error) {
    /* TODO: Update error message after implementation of user-specified CORS-Proxies */
    throw new Error('Could not fetch the given RSS feed. ' +
                    `Is the corsProxyURL specified in src/utils.js working? ${error}`);
  }
}
