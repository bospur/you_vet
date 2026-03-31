export type { Article, ArticleStatus, ArticleInput } from '@you-vet/types';

export interface ArticleFormValues {
  title: string;
  slug: string;
  content: string;
  categoryIds: number[];
}
