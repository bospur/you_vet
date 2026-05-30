import axiosInstance from './axiosInstance';

export interface StatsSummary {
  today: number;
  last_7_days: number;
  last_30_days: number;
  total: number;
}

export interface TelegramAppUser {
  telegram_user_id: number;
  first_name: string;
  username: string;
  first_seen: string;
  last_seen: string;
}

export const fetchStatsSummary = () =>
  axiosInstance.get<StatsSummary>('/api/admin/stats/summary').then((r) => r.data);

export const fetchTelegramAppUsers = () =>
  axiosInstance.get<TelegramAppUser[]>('/api/admin/stats/users').then((r) => r.data ?? []);
