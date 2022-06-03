export interface Podcast extends PodcastTags {
  episodes?: Episode[];
  infoUrl?: string;
  imageUrl?: string;
  imageTitle?: string;
  copyright?: string;
}

export const MANDATORY_ARWEAVE_TAGS = [
  'subscribeUrl',
  'title',
  'description',
] as const;

export const OPTIONAL_ARWEAVE_STRING_TAGS = [
  'id',
  'author',
  'summary',
  'explicit',
  'subtitle',
  'language',
  'creator',
  'ownerName',
  'ownerEmail',
  'managingEditor',
  'firstEpisodeDate',
  'lastEpisodeDate',
  'metadataBatch',
  'lastBuildDate',
] as const;

/**
 * These tags exist as e.g. multiple `Ponder-category` tags on an Arweave Transaction, but
 * internally we refer to them as `categories: string[]` (mapped to plural through `fromTag()`).
 */
const OPTIONAL_ARWEAVE_PLURAL_TAGS = [
  'categories',
  'keywords',
  'episodesKeywords',
] as const;

export const ALLOWED_ARWEAVE_TAGS = [
  ...MANDATORY_ARWEAVE_TAGS,
  ...OPTIONAL_ARWEAVE_STRING_TAGS,
  ...OPTIONAL_ARWEAVE_PLURAL_TAGS,
] as const;

export interface PodcastTags {
  subscribeUrl: string;
  title: string;
  id?: string;
  description?: string;
  author?: string;
  summary?: string;
  explicit?: string;
  subtitle?: string;
  language?: string;
  creator?: string;
  ownerName?: string;
  ownerEmail?: string;
  managingEditor?: string;
  categories?: string[];
  keywords?: string[];
  episodesKeywords?: string[];
  firstEpisodeDate?: Date;
  lastEpisodeDate?: Date;
  metadataBatch?: number;
  lastBuildDate?: Date;
}

export interface PodcastDTO extends Omit<Podcast, 'firstEpisodeDate' | 'lastEpisodeDate'
| 'metadataBatch' | 'episodes' | 'lastBuildDate'> {
  firstEpisodeDate: string;
  lastEpisodeDate: string;
  metadataBatch: string;
  episodes: EpisodeDTO[];
  lastBuildDate?: string;
}

export interface EpisodeDTO extends Omit<Episode, 'publishedAt'> {
  publishedAt: string;
}

export type ErrorStruct = {
  errorMessage: string;
  // errorObj?: Error | null;
};

export interface PodcastFeedError extends ErrorStruct {}

export type Episode = {
  title: string;
  publishedAt: Date;
  categories?: string[];
  keywords?: string[];
  subtitle?: string;
  contentHtml?: string;
  summary?: string;
  guid?: string;
  infoUrl?: string;
  mediaUrl?: string;
  mediaType?: string;
  mediaLength?: string;
  duration?: string;
  imageUrl?: string;
  imageTitle?: string;
  explicit?: string;
};

export interface DisjointGraphFunctionNode extends Pick<Podcast, 'subscribeUrl'> {
  keywordsAndCategories: string[];
  visited: boolean;
}
