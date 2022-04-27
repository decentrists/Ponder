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
}

export type Episode = {
  title: string;
  url: string;
  publishedAt:string;
  categories: string[];
  keywords: string[];
};

export interface DisjointGraphFunctionNode extends Pick<Podcast, 'subscribeUrl'> {
  keywordsAndCategories: string[];
  visited: boolean;
}