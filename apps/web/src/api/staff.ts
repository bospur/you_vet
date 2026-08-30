import { authenticatedFetch } from './authenticatedFetch';
import { staffBaseURL } from './client';

export interface StaffBookingRequest {
  id: number;
  service_type_id: number;
  service_name: string;
  requested_date: string;
  slot_time: string | null;
  client_name: string;
  client_phone: string;
  pet_name: string;
  status: string;
  reject_reason: string | null;
  created_at: string;
}

export interface StaffGroomingAppointment {
  id: number;
  breed: string;
  service_name: string;
  date: string;
  pet_name: string;
  owner_phone: string;
  start_time: string;
  end_time: string;
  status: string;
}

async function readJSON<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const fetchStaffBookingRequests = (status?: string) =>
  authenticatedFetch(
    `${staffBaseURL}/booking/requests${status ? `?status=${encodeURIComponent(status)}` : ''}`,
  ).then((r) => readJSON<StaffBookingRequest[]>(r));

export const patchStaffBookingRequest = (
  id: number,
  body: { status: string; reject_reason?: string },
) =>
  authenticatedFetch(`${staffBaseURL}/booking/requests/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => readJSON<StaffBookingRequest>(r));

export const fetchStaffGroomingAppointments = (date: string) =>
  authenticatedFetch(
    `${staffBaseURL}/grooming/appointments?date=${encodeURIComponent(date)}`,
  ).then((r) => readJSON<StaffGroomingAppointment[]>(r));

export const patchStaffGroomingAppointment = (id: number, status: string) =>
  authenticatedFetch(`${staffBaseURL}/grooming/appointments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  }).then((r) => readJSON<StaffGroomingAppointment>(r));
