import axiosInstance from './axiosInstance';
import type {
  GroomingBreed,
  GroomingBreedGroupInput,
  GroomingTemplateSlot,
  GroomingTemplateInput,
  GroomingAppointment,
  GroomingAppointmentInput,
} from '../../modules/grooming/domain/types';
import type { GroomingBreedGroupFormValues } from '../../modules/grooming/domain/types';
import { parseOptionalPrice } from '../../modules/grooming/domain/formatPrice';

// ── Породы ────────────────────────────────────────────────────────────────────

export async function getBreeds(): Promise<GroomingBreed[]> {
  const { data } = await axiosInstance.get<GroomingBreed[]>('/api/admin/grooming/breeds');
  return data ?? [];
}

function toGroupPayload(
  values: GroomingBreedGroupFormValues,
  originalBreed?: string,
): GroomingBreedGroupInput {
  return {
    breed: values.breed.trim(),
    description: values.description.trim() || null,
    original_breed: originalBreed,
    services: values.services.map((s) => {
      const from = parseOptionalPrice(s.price_from);
      const to = parseOptionalPrice(s.price_to);
      return {
        service_name: s.service_name.trim() || 'Стрижка',
        duration: typeof s.duration === 'number' ? s.duration : 0,
        price_from: from,
        price_to: to ?? from,
      };
    }),
  };
}

export async function saveBreedGroup(
  values: GroomingBreedGroupFormValues,
  originalBreed?: string,
): Promise<GroomingBreed[]> {
  const { data } = await axiosInstance.put<GroomingBreed[]>(
    '/api/admin/grooming/breed-groups',
    toGroupPayload(values, originalBreed),
  );
  return data ?? [];
}

export async function deleteBreedGroup(breedName: string): Promise<void> {
  await axiosInstance.delete('/api/admin/grooming/breed-groups', {
    params: { name: breedName },
  });
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
