import axiosInstance from './axiosInstance';
import { CLINIC_SLUG } from '../../shared/config/env';
import type { Category, CategoryFormValues } from '../../modules/categories/domain/types';

export async function getCategoriesByAnimalSlug(animalSlug: string): Promise<Category[]> {
  const { data } = await axiosInstance.get<Category[]>(
    `/api/clinics/${CLINIC_SLUG}/animals/${animalSlug}/categories`,
  );
  return data ?? [];
}

export async function createCategory(input: CategoryFormValues): Promise<Category> {
  const { data } = await axiosInstance.post<Category>('/api/admin/categories', input);
  return data;
}

export async function updateCategory(id: number, input: CategoryFormValues): Promise<Category> {
  const { data } = await axiosInstance.put<Category>(`/api/admin/categories/${id}`, input);
  return data;
}

export async function deleteCategory(id: number): Promise<void> {
  await axiosInstance.delete(`/api/admin/categories/${id}`);
}
