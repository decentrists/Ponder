import parser from './parser';
import Parser from 'rss-parser/index.d';
import {
  Episode,
  Podcast,
  PodcastFeedError,
} from '../interfaces';
import {
  withCorsProxy,
  toDate,
  isNotEmpty,
  hasMetadata,
  omitEmptyMetadata,
  valuePresent,
  isValidString,
  isValidDate,
} from '../../utils';
import {
  mergeArraysToLowerCase, // applies sanitizeString(array.element, allowHtml = false)
  sanitizeString,
  sanitizeUri,
} from '../metadata-filtering';
import { initializeKeywords } from '../metadata-filtering/generation';

interface RssPodcastFeed extends Parser.Output<any>, Omit<Podcast, 'title'> {
  categories?: string[];
  keywords?: string[];
  owner?: {
    name?: string;
    email?: string;
  };
  lastBuildDate?: string;
}

/**
 * @param feed
 * @param subscribeUrl
 * @returns {Podcast}
 * @throws {Error} If any of the mandatory podcast metadata are empty/missing after filtering
 */
function formatPodcastFeed(feed: RssPodcastFeed, subscribeUrl: Podcast['subscribeUrl']) : Podcast {
  const { items, ...podcast } = feed;
  const itunesData = isNotEmpty(podcast.itunes) ? podcast.itunes : {};

  // Any subcategories are nested within podcast.itunes.categoriesWithSubs[i].subs[j].name
  const itunesSubCategories = (itunesData.categoriesWithSubs || [])
    .reduce((acc : string[], cat : { subs: { name: string } }) =>
      acc.concat(Array.isArray(cat.subs) ? cat.subs.map(subCat => subCat.name) : []), []);

  const optionalPodcastTags : Omit<Podcast, 'id' | 'subscribeUrl' | 'title' | 'episodes'> = {
    categories:     mergeArraysToLowerCase(podcast.categories,
      (itunesData.categories || []).concat(itunesSubCategories)),
    subtitle:       sanitizeString(podcast.subtitle || itunesData.subtitle || ''),
    description:    sanitizeString(podcast.description || itunesData.description || ''),
    summary:        sanitizeString(podcast.summary || itunesData.summary || ''),
    infoUrl:        sanitizeUri(podcast.link || podcast.docs || ''),
    imageUrl:       sanitizeUri(podcast.image?.url || itunesData.image || ''),
    imageTitle:     sanitizeString(podcast.image?.title || ''),
    language:       sanitizeString(podcast.language || itunesData.language || ''),
    explicit:       sanitizeString(podcast.explicit || itunesData.explicit || ''),
    author:         sanitizeString(itunesData.author || podcast.author || podcast.creator || ''),
    ownerName:      sanitizeString(podcast.owner?.name || itunesData.owner?.name || ''),
    ownerEmail:     sanitizeString(podcast.owner?.email || itunesData.owner?.email || ''),
    copyright:      sanitizeString(podcast.copyright || itunesData.copyright || ''),
    managingEditor: sanitizeString(podcast.managingEditor || itunesData.managingEditor || ''),
    lastBuildDate:  toDate(podcast.lastBuildDate),
  };
  // TODO: data optimization:
  //       if podcast.description ~= podcast.summary ~= podcast.subtitle
  //       then keep only `description`
  //         ~= : all.lengths match by >=95% && each.substring(0, 20) matches 100%
  // TODO: same for:
  //       if sanitizeString(episode.contentHtml, false) ~= episode.summary ~= episode.subtitle

  const episodesKeywords = new Set();
  const episodes = (items || [])
    .map(episode => {
      const itunes = isNotEmpty(episode.itunes) ? episode.itunes : {};

      // TODO: find a way to parse episodes' guest(s) to episodeKeywords
      const episodeKeywords = mergeArraysToLowerCase(episode.keywords, itunes.keywords);
      episodeKeywords.forEach(key => episodesKeywords.add(key));

      const optionalEpisodeTags : Omit<Episode, 'title' | 'publishedAt'> = {
        subtitle:    sanitizeString(episode.subtitle || itunes.subtitle || ''),
        contentHtml: sanitizeString(episode['content:encoded'] || episode.content || '', true),
        summary:     sanitizeString(itunes.summary || episode.contentSnippet || ''),
        guid:        sanitizeString(episode.guid || itunes.guid || ''),
        infoUrl:     sanitizeUri(episode.link || episode.docs || ''),
        mediaUrl:    sanitizeUri(episode.enclosure?.url || ''),
        mediaType:   sanitizeString(episode.enclosure?.type || ''),
        mediaLength: sanitizeString(episode.enclosure?.length || episode.length || ''),
        duration:    sanitizeString(episode.duration || itunes.duration || ''),
        imageUrl:    sanitizeUri(episode.image?.url || itunes.image || ''),
        imageTitle:  sanitizeString(episode.image?.title || ''),
        explicit:    sanitizeString(episode.explicit || itunes.explicit || ''),
        categories:  mergeArraysToLowerCase(episode.categories, itunes.categories),
        keywords:    episodeKeywords,
      };
      // Select only the optionalEpisodeTags not yet present in the optionalPodcastTags
      const selectedEpisodeTags : Omit<Episode, 'title' | 'publishedAt'> = {};
      Object.entries(optionalEpisodeTags).forEach(([tagName, value]) => {
        if (optionalPodcastTags[tagName] !== value) selectedEpisodeTags[tagName] = value;
      });

      const mandatoryEpisodeTags = {
        title:       sanitizeString(episode.title || itunes.title),
        publishedAt: toDate(episode.isoDate || episode.pubDate),
      };
      return omitEmptyMetadata({ ...mandatoryEpisodeTags, ...selectedEpisodeTags }) as Episode;
    })
    .filter(episode => isValidString(episode.title) && isValidDate(episode.publishedAt));

  // Add episode tags that must be GraphQL-searchable to top-level. TODO: integrate in other modules
  optionalPodcastTags.episodesKeywords = [...episodesKeywords];

  const mandatoryPodcastTags = {
    subscribeUrl:   sanitizeString(podcast.feedUrl || subscribeUrl || ''),
    title:          sanitizeString(podcast.title || ''),
    episodes,
    keywords:       mergeArraysToLowerCase(podcast.keywords, itunesData.keywords),
  };

  // We should at least add one keyword referencing the Podcast Author(s)
  mandatoryPodcastTags.keywords =
    initializeKeywords(optionalPodcastTags, mandatoryPodcastTags.keywords);

  Object.entries(mandatoryPodcastTags).forEach(([tagName, value]) => {
    if (!valuePresent(value)) {
      throw new Error(
        `Could not parse RSS feed ${subscribeUrl}: required property '${tagName}' is empty.`);
    }
  });

  return omitEmptyMetadata({ ...mandatoryPodcastTags, ...optionalPodcastTags }) as Podcast;
}

/**
 * @param {*} subscribeUrl
 * @returns {(Podcast|PodcastFeedError)}
 */
export async function getPodcastFeed(subscribeUrl: Podcast['subscribeUrl']) :
Promise<Podcast | PodcastFeedError> {
  let errorMessage;
  let feed;
  try {
    feed = await parser.parseURL(withCorsProxy(subscribeUrl));
    return formatPodcastFeed(feed as RssPodcastFeed, subscribeUrl!);
  }
  catch (ex) {
    /* TODO: Update error message after implementation of user-specified CORS-Proxies */
    const getFeedErrorMessage = `Could not fetch RSS feed ${subscribeUrl}.\n` +
                                `Is the corsProxyURL specified in src/utils.js working?\n${ex}`;
    const formatFeedErrorMessage = (ex as Error).message;
    errorMessage = !hasMetadata(feed) ? getFeedErrorMessage : formatFeedErrorMessage;
  }
  return { errorMessage };
}
