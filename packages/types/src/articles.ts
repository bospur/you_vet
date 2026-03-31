export type ArticleStatus = 'draft' | 'published';

export interface Article {
  id: number;
  title: string;
  content: string;
  slug: string;
  status: ArticleStatus;
}

export interface ArticleInput {
  title: string;
  content: string;
  slug: string;
}
