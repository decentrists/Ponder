export interface Podcast extends PodcastTags, PodcastContent {
  [key: string]: any;
}

export interface PodcastTags {
  id: string;
  subscribeUrl: string;
  title: string;
  categories?: string[];
  keywords?: string[];
  episodesKeywords?: string[];
  firstEpisodeDate?: Date;
  lastEpisodeDate?: Date;
  metadataBatch?: number;
  lastBuildDate?: Date;
}

export interface PodcastContent {
  episodes?: Episode[];
  description?: string;
  infoUrl?: string;
  imageUrl?: string;
  imageTitle?: string;
  author?: string;
  summary?: string;
  explicit?: string;
  subtitle?: string;
  docs?: string;
  language?: string;
  creator?: string;
  copyright?: string;
  ownerName?: string;
  ownerEmail?: string;
  managingEditor?: string;
}

export interface PodcastSeed {
  content: PodcastContent,
  tags: PodcastTags,
}

export interface PodcastDTO extends Omit<Podcast, 'firstEpisodeDate' | 'lastEpisodeDate'
| 'metadataBatch' | 'episodes'> {
  firstEpisodeDate: string;
  lastEpisodeDate: string;
  metadataBatch: string;
  episodes: EpisodeDTO[];
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
