import parser from './parser';
import { toDate, withCorsProxy } from '../../utils';
import {
  Episode, 
  Podcast, 
} from '../../components/pod-graph/cytoscape/graph-logic/interfaces/interfaces';

function mergeItunesData(items: string[] = [], itunes: string[] = []) {
  return (items).concat(itunes)
    .filter((a, i, xs) => xs.indexOf(a) === i)
    .map(a => a.toLowerCase());
}

export async function getPodcastFeed(subscribeUrl: Podcast['subscribeUrl']) {
  let errorMessage;
  try {
    const { items, ...podcast } = await parser.parseURL(withCorsProxy(subscribeUrl));
    const imageUrl = podcast.image?.url || podcast.itunes?.image || '';
    const episodes = (items || []).map(episode => ({
      title: episode.title,
      url: episode.enclosure?.url || episode.link || '',
      publishedAt: toDate(episode.isoDate || episode.pubDate || '') ?? undefined,
      imageUrl: episode.image?.url || imageUrl,
      categories: mergeItunesData(episode.categories, episode.itunes?.categories),
      keywords: mergeItunesData(episode.keywords, episode.itunes?.keywords),
    })) as Episode[];
    const result : Partial<Podcast> = {
      subscribeUrl,
      title: podcast.title,
      description: podcast.description || podcast.itunes?.summary || 'null',
      imageUrl,
      imageTitle: podcast.image?.title || 'null',
      language: podcast.language || 'null',
      categories: mergeItunesData(podcast.categories, podcast.itunes?.categories),
      keywords: mergeItunesData(podcast.keywords, podcast.itunes?.keywords),
      episodes,
    };
    return result;
  }
  catch (ex) {
    /* TODO: Update error message after implementation of user-specified CORS-Proxies */
    errorMessage = 'Could not fetch the given RSS feed. ' +
                   `Is the corsProxyURL specified in src/utils.js working?\n${ex}`;
  }
  return { errorMessage };
}
