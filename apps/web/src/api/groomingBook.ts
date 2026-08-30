import { apiClient } from './client';

export interface GroomingSlot {
  start_time: string;
  end_time: string;
  available: boolean;
}

export interface GroomingAvailability {
  date: string;
  time_from: string;
  time_to: string;
  duration_min: number;
  slots: GroomingSlot[];
}

export interface GroomingAppointment {
  id: number;
  breed_id: number;
  breed: string;
  service_name: string;
  date: string;
  pet_name: string;
  owner_phone: string;
  start_time: string;
  end_time: string;
  status: string;
}

export const fetchGroomingAvailability = (date: string, breedId: number) =>
  apiClient
    .get<GroomingAvailability>('/grooming/availability', {
      params: { date, breed_id: breedId },
    })
    .then((r) => r.data);

export const fetchMyGroomingAppointments = () =>
  apiClient.get<GroomingAppointment[]>('/grooming/appointments').then((r) => r.data);

export const createGroomingAppointment = (input: {
  breed_id: number;
  date: string;
  start_time: string;
  pet_name: string;
  owner_phone: string;
}) => apiClient.post<GroomingAppointment>('/grooming/appointments', input).then((r) => r.data);
