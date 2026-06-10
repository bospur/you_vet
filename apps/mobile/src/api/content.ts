import { apiClient } from './client';

export interface Animal {
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

export interface FeaturedArticle {
  id: number;
  title: string;
  slug: string;
  animal_name: string;
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

export interface GroomingBreed {
  id: number;
  breed: string;
  service_name: string;
  duration: number;
  price_from: number | null;
  price_to: number | null;
  description: string | null;
}

export interface GroomingScheduleSlot {
  id: number;
  day_of_week: number;
  time_from: string;
  time_to: string;
}

export interface BookingServiceType {
  id: number;
  name: string;
}

export interface ClientQuestionCreated {
  id: number;
  created_at: string;
}

export const fetchAnimals = () =>
  apiClient.get<Animal[]>('/animals').then((r) => r.data);

export const fetchArticles = (animalSlug: string) =>
  apiClient.get<ArticleListItem[]>(`/animals/${animalSlug}/articles`).then((r) => r.data);

export const fetchArticle = (articleSlug: string) =>
  apiClient.get<Article>(`/articles/${articleSlug}`).then((r) => r.data);

export const fetchFeaturedArticles = () =>
  apiClient.get<FeaturedArticle[]>('/articles/featured').then((r) => r.data ?? []);

export const fetchDoctors = () =>
  apiClient.get<Doctor[]>('/doctors').then((r) => r.data);

export const fetchSchedule = () =>
  apiClient.get<{ entries: ScheduleEntry[] }>('/schedule').then((r) => r.data.entries ?? []);

export const fetchGroomingBreeds = () =>
  apiClient.get<GroomingBreed[]>('/grooming/breeds').then((r) => r.data);

export const fetchGroomingSchedule = () =>
  apiClient.get<GroomingScheduleSlot[]>('/grooming/schedule').then((r) => r.data);

export const fetchBookingServiceTypes = () =>
  apiClient.get<BookingServiceType[]>('/booking/service-types').then((r) => r.data);

export const submitClientQuestion = (text: string) =>
  apiClient.post<ClientQuestionCreated>('/questions', { text }).then((r) => r.data);
