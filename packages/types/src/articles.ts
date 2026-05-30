export type ArticleStatus = 'draft' | 'published';

export interface Article {
  id: number;
  animal_id: number;
  animal_name?: string;
  title: string;
  content: string;
  slug: string;
  status: ArticleStatus;
  featured: boolean;
}

export interface ArticleListItem {
  id: number;
  title: string;
  slug: string;
}

export interface FeaturedArticle {
  id: number;
  title: string;
  slug: string;
  animal_name: string;
}

export interface ArticleInput {
  title: string;
  content: string;
  animal_id: number;
}
