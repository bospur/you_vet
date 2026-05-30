import axiosInstance from './axiosInstance';
import type { Animal, AnimalFormValues } from '../../modules/animals/domain/types';

export async function getAnimals(): Promise<Animal[]> {
  const { data } = await axiosInstance.get<Animal[]>('/api/admin/animals');
  return data ?? [];
}

export async function createAnimal(input: AnimalFormValues): Promise<Animal> {
  const { data } = await axiosInstance.post<Animal>('/api/admin/animals', input);
  return data;
}

export async function updateAnimal(id: number, input: AnimalFormValues): Promise<Animal> {
  const { data } = await axiosInstance.put<Animal>(`/api/admin/animals/${id}`, input);
  return data;
}

export async function deleteAnimal(id: number): Promise<void> {
  await axiosInstance.delete(`/api/admin/animals/${id}`);
}
