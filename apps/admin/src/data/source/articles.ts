import axiosInstance from './axiosInstance';
import type { Article, ArticleFormValues } from '../../modules/articles/domain/types';

export async function getArticles(): Promise<Article[]> {
  const { data } = await axiosInstance.get<Article[]>('/api/admin/articles');
  return data ?? [];
}

export async function getArticle(id: number): Promise<Article> {
  const { data } = await axiosInstance.get<Article>(`/api/admin/articles/${id}`);
  return data;
}

export async function createArticle(input: ArticleFormValues): Promise<Article> {
  const { data } = await axiosInstance.post<Article>('/api/admin/articles', {
    title: input.title,
    content: input.content,
    animal_id: input.animal_id,
  });
  return data;
}

export async function updateArticle(id: number, input: ArticleFormValues): Promise<Article> {
  const { data } = await axiosInstance.put<Article>(`/api/admin/articles/${id}`, {
    title: input.title,
    content: input.content,
    animal_id: input.animal_id,
  });
  return data;
}

export async function updateArticleStatus(id: number, status: 'draft' | 'published'): Promise<Article> {
  const { data } = await axiosInstance.patch<Article>(`/api/admin/articles/${id}/status`, { status });
  return data;
}

export async function deleteArticle(id: number): Promise<void> {
  await axiosInstance.delete(`/api/admin/articles/${id}`);
}
