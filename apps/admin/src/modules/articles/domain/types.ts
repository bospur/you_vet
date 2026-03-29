export type ArticleStatus = 'draft' | 'published';

export interface Article {
  id: number;
  title: string;
  content: string;
  slug: string;
  status: ArticleStatus;
}

export interface ArticleFormValues {
  title: string;
  slug: string;
  content: string;
  categoryIds: number[];
}
