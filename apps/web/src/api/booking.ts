import { apiClient } from './client';

export interface BookingServiceType {
  id: number;
  name: string;
  category: 'uzi' | 'surgery' | 'xray';
  species_filter: 'any' | 'cats_only';
  default_duration_min: number;
  booking_mode: 'instant' | 'pending_request';
  schedule_style: 'day_capacity' | 'dropoff' | 'time_slots';
  instructions_client: string | null;
  rules: unknown;
  sort_order: number;
}

export interface BookingTimeSlot {
  time: string;
  booked_slots: number;
  max_slots: number;
  remaining: number;
}

export interface BookingAvailabilityDay {
  date: string;
  is_open: boolean;
  max_slots: number;
  booked_slots: number;
  remaining: number;
  intake_from: string | null;
  intake_to: string | null;
  pickup_after: string | null;
  slot_mode: string;
  time_slots?: BookingTimeSlot[];
}

export interface BookingAvailability {
  service_type_id: number;
  horizon_weeks: number;
  from: string;
  to: string;
  days: BookingAvailabilityDay[];
}

export interface BookingRequest {
  id: number;
  service_type_id: number;
  service_name: string;
  requested_date: string;
  slot_time: string | null;
  pet_name: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'rescheduled';
  reject_reason: string | null;
  created_at: string;
}

export interface CreateBookingRequestInput {
  service_type_id: number;
  requested_date: string;
  slot_time?: string;
  client_name: string;
  client_phone: string;
  pet_name: string;
  pet_species?: string;
  pet_age_years?: number;
}

export const fetchBookingServiceTypes = () =>
  apiClient.get<BookingServiceType[]>('/booking/service-types').then((r) => r.data);

export const fetchBookingAvailability = (serviceTypeId: number) =>
  apiClient
    .get<BookingAvailability>('/booking/availability', {
      params: { service_type_id: serviceTypeId },
    })
    .then((r) => r.data);

export const fetchMyBookingRequests = () =>
  apiClient.get<BookingRequest[]>('/booking/requests').then((r) => r.data);

export const createBookingRequest = (input: CreateBookingRequestInput) =>
  apiClient.post<BookingRequest>('/booking/requests', input).then((r) => r.data);

export const cancelBookingRequest = (id: number) =>
  apiClient
    .patch<BookingRequest>(`/booking/requests/${id}`, { status: 'cancelled' })
    .then((r) => r.data);
