import axiosInstance from './axiosInstance';
import { postFormData } from './uploadFormData';
import type {
  Doctor,
  DoctorFormValues,
  DoctorScheduleSlot,
  DoctorScheduleException,
  ClinicSettings,
  ScheduleEntry,
} from '../../modules/doctors/domain/types';

// ── Врачи ─────────────────────────────────────────────────────────────────────

export async function getDoctors(): Promise<Doctor[]> {
  const { data } = await axiosInstance.get<Doctor[]>('/api/admin/doctors');
  return data ?? [];
}

export async function getDoctor(id: number): Promise<Doctor> {
  const { data } = await axiosInstance.get<Doctor>(`/api/admin/doctors/${id}`);
  return data;
}

export async function createDoctor(input: DoctorFormValues): Promise<Doctor> {
  const { data } = await axiosInstance.post<Doctor>('/api/admin/doctors', input);
  return data;
}

export async function updateDoctor(id: number, input: DoctorFormValues): Promise<Doctor> {
  const { data } = await axiosInstance.put<Doctor>(`/api/admin/doctors/${id}`, input);
  return data;
}

export async function updateDoctorStatus(id: number, status: 'draft' | 'published'): Promise<Doctor> {
  const { data } = await axiosInstance.patch<Doctor>(`/api/admin/doctors/${id}/status`, { status });
  return data;
}

export async function uploadDoctorPhoto(id: number, file: File): Promise<{ photo_url: string }> {
  return postFormData<{ photo_url: string }>(`/api/admin/doctors/${id}/photo`, 'photo', file);
}

export async function deleteDoctor(id: number): Promise<void> {
  await axiosInstance.delete(`/api/admin/doctors/${id}`);
}

export interface DoctorPWAAccount {
  login: string;
  password?: string;
  login_url: string;
  mobile_user_id: number;
  created?: boolean;
  reset?: boolean;
}

export async function provisionDoctorPWA(id: number, reset = false): Promise<DoctorPWAAccount> {
  const { data } = await axiosInstance.post<DoctorPWAAccount>(
    `/api/admin/doctors/${id}/pwa-account`,
    { reset },
  );
  return data;
}

// ── Расписание ────────────────────────────────────────────────────────────────

export async function getDoctorSchedule(id: number): Promise<DoctorScheduleSlot[]> {
  const { data } = await axiosInstance.get<DoctorScheduleSlot[]>(`/api/admin/doctors/${id}/schedule`);
  return data ?? [];
}

export async function addScheduleSlot(
  id: number,
  slot: { day_of_week: number; time_from: string; time_to: string },
): Promise<DoctorScheduleSlot> {
  const { data } = await axiosInstance.post<DoctorScheduleSlot>(`/api/admin/doctors/${id}/schedule`, slot);
  return data;
}

export async function deleteScheduleSlot(doctorId: number, slotId: number): Promise<void> {
  await axiosInstance.delete(`/api/admin/doctors/${doctorId}/schedule/${slotId}`);
}

// ── Исключения ────────────────────────────────────────────────────────────────

export async function getExceptions(id: number): Promise<DoctorScheduleException[]> {
  const { data } = await axiosInstance.get<DoctorScheduleException[]>(
    `/api/admin/doctors/${id}/schedule/exceptions`,
  );
  return data ?? [];
}

export async function upsertException(
  id: number,
  ex: { date: string; is_day_off: boolean; time_from?: string | null; time_to?: string | null },
): Promise<DoctorScheduleException> {
  const { data } = await axiosInstance.put<DoctorScheduleException>(
    `/api/admin/doctors/${id}/schedule/exceptions`,
    ex,
  );
  return data;
}

function eachDateInRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const cur = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export async function addVacationRange(id: number, dateFrom: string, dateTo: string): Promise<number> {
  const dates = eachDateInRange(dateFrom, dateTo);
  for (const date of dates) {
    await upsertException(id, { date, is_day_off: true, time_from: null, time_to: null });
  }
  return dates.length;
}

export async function deleteException(doctorId: number, exceptionId: number): Promise<void> {
  await axiosInstance.delete(`/api/admin/doctors/${doctorId}/schedule/exceptions/${exceptionId}`);
}

// ── Настройки клиники ─────────────────────────────────────────────────────────

export async function getSettings(): Promise<ClinicSettings> {
  const { data } = await axiosInstance.get<ClinicSettings>('/api/admin/settings');
  return data;
}

export interface AdminScheduleResponse {
  from: string;
  to: string;
  entries: ScheduleEntry[];
}

export async function getSchedulePeriod(from: string, to: string): Promise<AdminScheduleResponse> {
  const { data } = await axiosInstance.get<AdminScheduleResponse>('/api/admin/schedule', {
    params: { from, to },
  });
  return data;
}

export async function updateSettings(weeks: number): Promise<ClinicSettings> {
  const { data } = await axiosInstance.patch<ClinicSettings>('/api/admin/settings', {
    schedule_display_weeks: weeks,
  });
  return data;
}

// ── Публичное расписание (для превью) ─────────────────────────────────────────

export interface PublicScheduleResponse {
  entries: ScheduleEntry[];
  settings: ClinicSettings;
}
