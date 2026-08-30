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

export type MobileAppRole = 'client' | 'doctor' | 'groomer' | 'chief_vet';

export interface MobileAppUser {
  id: number;
  display_name: string;
  phone: string;
  email?: string;
  telegram_user_id?: number;
  vk_user_id?: number;
  photo_url: string;
  linked_at?: string;
  created_at: string;
  app_role?: MobileAppRole;
}

export const fetchMobileStatsSummary = () =>
  axiosInstance.get<StatsSummary>('/api/admin/stats/mobile/summary').then((r) => r.data);

export const fetchMobileAppUsers = () =>
  axiosInstance.get<MobileAppUser[]>('/api/admin/stats/mobile/users').then((r) => r.data ?? []);

export const deleteMobileAppUser = (id: number) =>
  axiosInstance.delete(`/api/admin/stats/mobile/users/${id}`);

export const patchMobileAppRole = (id: number, app_role: MobileAppRole) =>
  axiosInstance
    .patch<MobileAppUser>(`/api/admin/stats/mobile/users/${id}/role`, { app_role })
    .then((r) => r.data);

export const inviteMobileStaff = (body: {
  phone?: string;
  email?: string;
  display_name?: string;
  app_role: MobileAppRole;
}) =>
  axiosInstance.post<MobileAppUser>('/api/admin/stats/mobile/staff', body).then((r) => r.data);
