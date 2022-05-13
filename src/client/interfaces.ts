export interface Podcast extends PodcastTags {
  [key: string]: any;
  episodes?: Episode[];
  infoUrl?: string;
  imageUrl?: string;
  imageTitle?: string;
  copyright?: string;
}

export const ALLOWED_STRING_TAGS = [
  'subscribeUrl',
  'title',
  'id',
  'description',
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
];

export const ALLOWED_TAGS = [
  'categories',
  'keywords',
  'episodesKeywords',
  ...ALLOWED_STRING_TAGS,
];


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

export interface PodcastDTO extends Omit<PodcastTags, 'firstEpisodeDate' | 'lastEpisodeDate'
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

export interface PodcastFeedError {
  errorMessage: string;
}

export type Episode = {
  [key: string]: any;
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
