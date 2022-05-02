export interface Podcast {
  id: string;
  subscribeUrl: string;
  label: string;
  categories: string[];
  keywords: string[];
  episodes: Episode[];
  description: string;
  title: string;
  imageUrl: string;
  imageTitle: string;
  firstEpisodeDate: Date;
  lastEpisodeDate: Date;
  language: string;
  metadataBatch: number;
}

export interface PodcastSeed {
  content: {
    description: string;
    imageUrl: string;
    imageTitle: string;
    language: string;
    episodes: Episode[];
  },
  tags: {
    id: string;
    subscribeUrl: string;
    title: string;
    categories: string[];
    keywords: string[];
    firstEpisodeDate: Date;
    lastEpisodeDate: Date;
    metadataBatch: number;
  },
}

export type Episode = {
  title: string;
  url: string;
  publishedAt: Date;
  categories: string[];
  keywords: string[];
};

export interface DisjointGraphFunctionNode extends Pick<Podcast['tags'], 'subscribeUrl'> {
  keywordsAndCategories: string[];
  visited: boolean;
}