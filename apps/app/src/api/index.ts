import { apiClient } from './client';

export interface Animal {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

export interface ArticleListItem {
  id: number;
  title: string;
  slug: string;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
}

export interface Doctor {
  id: number;
  full_name: string;
  specialty: string;
  description: string;
  contacts: string;
  photo_url: string;
  status: string;
}

export interface ScheduleEntry {
  doctor_id: number;
  full_name: string;
  specialty: string;
  photo_url: string;
  date: string;
  time_from: string;
  time_to: string;
}

export const fetchAnimals = () =>
  apiClient.get<Animal[]>('/animals').then((r) => r.data);

export const fetchCategories = (animalSlug: string) =>
  apiClient.get<Category[]>(`/animals/${animalSlug}/categories`).then((r) => r.data);

export const fetchArticles = (animalSlug: string, categorySlug: string) =>
  apiClient
    .get<ArticleListItem[]>(`/animals/${animalSlug}/categories/${categorySlug}/articles`)
    .then((r) => r.data);

export const fetchArticle = (articleSlug: string) =>
  apiClient.get<Article>(`/articles/${articleSlug}`).then((r) => r.data);

export const fetchDoctors = () =>
  apiClient.get<Doctor[]>('/doctors').then((r) => r.data);

export const fetchSchedule = () =>
  apiClient
    .get<{ entries: ScheduleEntry[] }>('/schedule')
    .then((r) => r.data.entries ?? []);

export interface GroomingBreed {
  id: number;
  breed: string;
  duration: number;
  price: number | null;
  description: string | null;
}

export interface GroomingScheduleSlot {
  id: number;
  day_of_week: number;
  time_from: string;
  time_to: string;
}

export const fetchGroomingBreeds = () =>
  apiClient.get<GroomingBreed[]>('/grooming/breeds').then((r) => r.data);

export const fetchGroomingSchedule = () =>
  apiClient.get<GroomingScheduleSlot[]>('/grooming/schedule').then((r) => r.data);
