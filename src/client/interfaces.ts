export interface Podcast extends PodcastTags, PodcastContent {}

export interface PodcastTags {
  id: string;
  subscribeUrl: string;
  title: string;
  categories: string[];
  keywords: string[];
  firstEpisodeDate: Date;
  lastEpisodeDate: Date;
  metadataBatch: number;
} 

export interface PodcastContent {
  description: string;
  imageUrl: string;
  imageTitle: string;
  language: string;
  episodes: Episode[];
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

export type Episode = {
  title: string;
  url: string;
  publishedAt: Date;
  categories: string[];
  keywords: string[];
};