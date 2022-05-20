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

interface RssPodcastFeed extends Parser.Output<any>, Omit<Podcast, 'title' | 'lastBuildDate'> {
  categories?: string[];
  keywords?: string[];
  owner?: {
    name?: string;
    email?: string;
  };
  docs?: string;
  lastBuildDate?: string;
}

type OptionalPodcastTags = Omit<Podcast, 'id' | 'subscribeUrl' | 'title' | 'episodes'>;
type OptionalEpisodeTags = Omit<Episode, 'title' | 'publishedAt'>;
type CategoriesWithSubs = {
  name?: string,
  subs?: [
    {
      name: string,
    },
  ],
};

/**
 * @param feed
 * @param subscribeUrl
 * @returns {Podcast}
 * @throws {Error} If any of the mandatory podcast metadata are empty/missing after filtering
 */
function formatPodcastFeed(feed: RssPodcastFeed, subscribeUrl: Podcast['subscribeUrl']) : Podcast {
  const { items, ...podcast } = feed;
  const podItunes = isNotEmpty(podcast.itunes) ? podcast.itunes : {};

  // Any subcategories are nested within podcast.itunes.categoriesWithSubs[i].subs[j].name
  const itunesSubCategories = (podItunes.categoriesWithSubs || [])
    .reduce((acc : string[], cat : CategoriesWithSubs) =>
      acc.concat(Array.isArray(cat.subs) ? cat.subs.map(subCat => subCat.name) : []), []);

  const optionalPodcastTags : OptionalPodcastTags = {
    categories:     mergeArraysToLowerCase(podcast.categories,
      (podItunes.categories || []).concat(itunesSubCategories)),
    subtitle:       sanitizeString(podcast.subtitle || podItunes.subtitle || ''),
    description:    sanitizeString(podcast.description || podItunes.description || ''),
    summary:        sanitizeString(podcast.summary || podItunes.summary || ''),
    infoUrl:        sanitizeUri(podcast.link || podcast.docs || ''),
    imageUrl:       sanitizeUri(podcast.image?.url || podItunes.image || ''),
    imageTitle:     sanitizeString(podcast.image?.title || ''),
    language:       sanitizeString(podcast.language || podItunes.language || ''),
    explicit:       sanitizeString(podcast.explicit || podItunes.explicit || ''),
    author:         sanitizeString(podItunes.author || podcast.author || podcast.creator || ''),
    ownerName:      sanitizeString(podcast.owner?.name || podItunes.owner?.name || ''),
    ownerEmail:     sanitizeString(podcast.owner?.email || podItunes.owner?.email || ''),
    copyright:      sanitizeString(podcast.copyright || podItunes.copyright || ''),
    managingEditor: sanitizeString(podcast.managingEditor || podItunes.managingEditor || ''),
    lastBuildDate:  toDate(podcast.lastBuildDate),
  };
  // TODO: data optimization:
  //       if podcast.description ~= podcast.summary ~= podcast.subtitle
  //       then keep only `description`
  //         ~= : all.lengths match by >=95% && each.substring(0, 20) matches 100%
  // TODO: same for:
  //       if sanitizeString(episode.contentHtml, false) ~= episode.summary ~= episode.subtitle

  const episodesKeywords = new Set<string>();
  const episodes : Episode[] = (items || [])
    .map(episode => {
      const itunes = isNotEmpty(episode.itunes) ? episode.itunes : {};

      // TODO: find a way to parse episodes' guest(s) to episodeKeywords
      const episodeKeywords = mergeArraysToLowerCase(episode.keywords, itunes.keywords);

      const optionalEpisodeTags : OptionalEpisodeTags = {
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
      let selectedEpisodeTags : OptionalEpisodeTags = {};
      Object.entries(optionalEpisodeTags).forEach(([tagName, value]) => {
        if (optionalPodcastTags[tagName as keyof OptionalPodcastTags] !== value) {
          selectedEpisodeTags = { ...selectedEpisodeTags, [tagName]: value };
        }
      });

      const mandatoryEpisodeTags = {
        title:       sanitizeString(episode.title || itunes.title),
        publishedAt: toDate(episode.isoDate || episode.pubDate),
      };
      const formattedEpisode =
        omitEmptyMetadata({ ...mandatoryEpisodeTags, ...selectedEpisodeTags }) as Episode;

      if (isValidString(formattedEpisode.title) && isValidDate(formattedEpisode.publishedAt)) {
        episodeKeywords.forEach(key => episodesKeywords.add(key));
        return formattedEpisode;
      }
      else return {} as Episode;
    })
    .filter(episode => Object.keys(episode).length !== 0);

  // Add episode tags that must be GraphQL-searchable to top-level
  optionalPodcastTags.episodesKeywords = [...episodesKeywords];

  const mandatoryPodcastTags = {
    subscribeUrl,
    title:          sanitizeString(podcast.title || ''),
    episodes,
    keywords:       mergeArraysToLowerCase(podcast.keywords, podItunes.keywords),
  };

  // We should at least add one keyword referencing the Podcast Author(s)
  mandatoryPodcastTags.keywords = initializeKeywords({
    ...optionalPodcastTags,
    title: mandatoryPodcastTags.title,
  }, mandatoryPodcastTags.keywords);

  Object.entries(mandatoryPodcastTags).forEach(([tagName, value]) => {
    if (!valuePresent(value)) {
      throw new Error(
        `Could not parse RSS feed ${subscribeUrl}: required property '${tagName}' is empty.`);
    }
  });

  return omitEmptyMetadata({ ...mandatoryPodcastTags, ...optionalPodcastTags }) as Podcast;
}

/**
 * @param subscribeUrl
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
