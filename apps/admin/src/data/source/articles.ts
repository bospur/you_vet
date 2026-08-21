import axios from 'axios';
import axiosInstance from './axiosInstance';
import type { Article, ArticleFormValues } from '../../modules/articles/domain/types';

function apiError(err: unknown, fallback: string): Error {
  if (axios.isAxiosError(err) && err.response?.data) {
    return new Error(String(err.response.data));
  }
  return err instanceof Error ? err : new Error(fallback);
}

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
  try {
    const { data } = await axiosInstance.patch<Article>(`/api/admin/articles/${id}/status`, { status });
    return data;
  } catch (err) {
    throw apiError(err, 'Ошибка изменения статуса');
  }
}

export async function updateArticleFeatured(id: number, featured: boolean): Promise<Article> {
  const { data } = await axiosInstance.patch<Article>(`/api/admin/articles/${id}/featured`, { featured });
  return data;
}

export async function deleteArticle(id: number): Promise<void> {
  await axiosInstance.delete(`/api/admin/articles/${id}`);
}
