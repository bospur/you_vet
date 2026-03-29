import axiosInstance from './axiosInstance';
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
  const form = new FormData();
  form.append('photo', file);
  const { data } = await axiosInstance.post<{ photo_url: string }>(
    `/api/admin/doctors/${id}/photo`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

export async function deleteDoctor(id: number): Promise<void> {
  await axiosInstance.delete(`/api/admin/doctors/${id}`);
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

export async function deleteException(doctorId: number, exceptionId: number): Promise<void> {
  await axiosInstance.delete(`/api/admin/doctors/${doctorId}/schedule/exceptions/${exceptionId}`);
}

// ── Настройки клиники ─────────────────────────────────────────────────────────

export async function getSettings(): Promise<ClinicSettings> {
  const { data } = await axiosInstance.get<ClinicSettings>('/api/admin/settings');
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
