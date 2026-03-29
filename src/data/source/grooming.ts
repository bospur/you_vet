import axiosInstance from './axiosInstance';
import type {
  GroomingBreed,
  GroomingBreedFormValues,
  GroomingTemplateSlot,
  GroomingTemplateInput,
  GroomingAppointment,
  GroomingAppointmentInput,
} from '../../modules/grooming/domain/types';

// ── Породы ────────────────────────────────────────────────────────────────────

export async function getBreeds(): Promise<GroomingBreed[]> {
  const { data } = await axiosInstance.get<GroomingBreed[]>('/api/admin/grooming/breeds');
  return data ?? [];
}

export async function createBreed(input: GroomingBreedFormValues): Promise<GroomingBreed> {
  const { data } = await axiosInstance.post<GroomingBreed>('/api/admin/grooming/breeds', {
    breed: input.breed,
    duration: input.duration,
    price: input.price !== '' ? Number(input.price) : null,
    description: input.description || null,
  });
  return data;
}

export async function updateBreed(id: number, input: GroomingBreedFormValues): Promise<GroomingBreed> {
  const { data } = await axiosInstance.put<GroomingBreed>(`/api/admin/grooming/breeds/${id}`, {
    breed: input.breed,
    duration: input.duration,
    price: input.price !== '' ? Number(input.price) : null,
    description: input.description || null,
  });
  return data;
}

export async function deleteBreed(id: number): Promise<void> {
  await axiosInstance.delete(`/api/admin/grooming/breeds/${id}`);
}

// ── Шаблон недели ─────────────────────────────────────────────────────────────

export async function getTemplate(): Promise<GroomingTemplateSlot[]> {
  const { data } = await axiosInstance.get<GroomingTemplateSlot[]>('/api/admin/grooming/template');
  return data ?? [];
}

export async function upsertTemplateSlot(input: GroomingTemplateInput): Promise<GroomingTemplateSlot> {
  const { data } = await axiosInstance.put<GroomingTemplateSlot>('/api/admin/grooming/template', input);
  return data;
}

export async function deleteTemplateSlot(dayOfWeek: number): Promise<void> {
  await axiosInstance.delete(`/api/admin/grooming/template/${dayOfWeek}`);
}

// ── Записи ────────────────────────────────────────────────────────────────────

export async function getAppointments(month: string): Promise<GroomingAppointment[]> {
  const { data } = await axiosInstance.get<GroomingAppointment[]>('/api/admin/grooming/appointments', {
    params: { month },
  });
  return data ?? [];
}

export async function createAppointment(input: GroomingAppointmentInput): Promise<GroomingAppointment> {
  const { data } = await axiosInstance.post<GroomingAppointment>('/api/admin/grooming/appointments', input);
  return data;
}

export async function deleteAppointment(id: number): Promise<void> {
  await axiosInstance.delete(`/api/admin/grooming/appointments/${id}`);
}
