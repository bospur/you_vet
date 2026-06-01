import axiosInstance from './axiosInstance';

export interface BookingServiceType {
  id: number;
  clinic_id: number;
  name: string;
  category: 'uzi' | 'surgery' | 'xray';
  species_filter: 'any' | 'cats_only';
  capacity_group: string | null;
  default_duration_min: number;
  booking_mode: 'instant' | 'pending_request';
  schedule_style: 'day_capacity' | 'dropoff' | 'time_slots';
  instructions_client: string | null;
  rules: unknown;
  is_active: boolean;
  sort_order: number;
}

export type BookingServiceTypeInput = {
  name: string;
  category: BookingServiceType['category'];
  species_filter: BookingServiceType['species_filter'];
  capacity_group: string | null;
  default_duration_min: number;
  booking_mode: BookingServiceType['booking_mode'];
  schedule_style: BookingServiceType['schedule_style'];
  seed_max_per_day?: number | null;
  instructions_client: string | null;
  rules: unknown;
  is_active: boolean;
  sort_order: number;
};

export async function getBookingServiceTypes(): Promise<BookingServiceType[]> {
  const { data } = await axiosInstance.get<BookingServiceType[]>('/api/admin/booking/service-types');
  return data;
}

export async function createBookingServiceType(input: BookingServiceTypeInput): Promise<BookingServiceType> {
  const { data } = await axiosInstance.post<BookingServiceType>('/api/admin/booking/service-types', input);
  return data;
}

export async function updateBookingServiceType(
  id: number,
  input: BookingServiceTypeInput,
): Promise<BookingServiceType> {
  const { data } = await axiosInstance.put<BookingServiceType>(`/api/admin/booking/service-types/${id}`, input);
  return data;
}

export async function deleteBookingServiceType(id: number): Promise<void> {
  await axiosInstance.delete(`/api/admin/booking/service-types/${id}`);
}

export interface BookingSettings {
  clinic_id: number;
  horizon_weeks: number;
  staff_chat_id: number | null;
}

export interface BookingWeeklyRule {
  id: number;
  day_of_week: number;
  intake_from: string | null;
  intake_to: string | null;
  pickup_after: string | null;
  max_per_day: number;
  slot_mode: string;
}

export interface BookingWindow {
  id: number;
  date_from: string;
  date_to: string;
  days_of_week: number[];
  max_per_day: number;
  intake_from: string | null;
  intake_to: string | null;
  pickup_after: string | null;
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
  source: string;
  doctor_id: number | null;
  doctor_name: string | null;
}

export interface BookingTimeSlot {
  time: string;
  booked_slots: number;
  max_slots: number;
  remaining: number;
}

export interface BookingAvailability {
  service_type_id: number;
  capacity_group: string | null;
  horizon_weeks: number;
  from: string;
  to: string;
  days: BookingAvailabilityDay[];
}

const q = (serviceTypeId: number) => `service_type_id=${serviceTypeId}`;

export async function getBookingSettings(): Promise<BookingSettings> {
  const { data } = await axiosInstance.get<BookingSettings>('/api/admin/booking/settings');
  return data;
}

export async function updateBookingHorizon(horizon_weeks: number): Promise<BookingSettings> {
  const { data } = await axiosInstance.patch<BookingSettings>('/api/admin/booking/settings', { horizon_weeks });
  return data;
}

export async function updateBookingStaffChat(staff_chat_id: number | null): Promise<BookingSettings> {
  const { data } = await axiosInstance.patch<BookingSettings>('/api/admin/booking/settings', {
    staff_chat_id,
  });
  return data;
}

export async function clearBookingStaffChat(): Promise<BookingSettings> {
  const { data } = await axiosInstance.patch<BookingSettings>('/api/admin/booking/settings', {
    clear_staff_chat: true,
  });
  return data;
}

export async function linkBookingStaffChat(chat_id?: number): Promise<BookingSettings | { instruction: string }> {
  const { data } = await axiosInstance.post<BookingSettings | { instruction: string }>(
    '/api/admin/booking/settings/link-chat',
    chat_id != null ? { chat_id } : {},
  );
  return data;
}

export async function getBookingWeeklyRules(serviceTypeId: number): Promise<BookingWeeklyRule[]> {
  const { data } = await axiosInstance.get<BookingWeeklyRule[]>(
    `/api/admin/booking/weekly-rules?${q(serviceTypeId)}`,
  );
  return data;
}

export async function upsertBookingWeeklyRule(
  serviceTypeId: number,
  body: Omit<BookingWeeklyRule, 'id' | 'slot_mode'> & { slot_mode?: string },
): Promise<BookingWeeklyRule> {
  const { data } = await axiosInstance.put<BookingWeeklyRule>(
    `/api/admin/booking/weekly-rules?${q(serviceTypeId)}`,
    body,
  );
  return data;
}

export async function deleteBookingWeeklyRule(serviceTypeId: number, dayOfWeek: number): Promise<void> {
  await axiosInstance.delete(
    `/api/admin/booking/weekly-rules?${q(serviceTypeId)}&day_of_week=${dayOfWeek}`,
  );
}

export async function getBookingWindows(serviceTypeId: number): Promise<BookingWindow[]> {
  const { data } = await axiosInstance.get<BookingWindow[]>(`/api/admin/booking/windows?${q(serviceTypeId)}`);
  return data;
}

export async function createBookingWindow(
  serviceTypeId: number,
  body: {
    date_from: string;
    date_to: string;
    days_of_week: number[];
    max_per_day: number;
    intake_from?: string | null;
    intake_to?: string | null;
    pickup_after?: string | null;
  },
): Promise<BookingWindow> {
  const { data } = await axiosInstance.post<BookingWindow>(
    `/api/admin/booking/windows?${q(serviceTypeId)}`,
    body,
  );
  return data;
}

export async function deleteBookingWindow(id: number): Promise<void> {
  await axiosInstance.delete(`/api/admin/booking/windows/${id}`);
}

export async function getBookingAvailability(serviceTypeId: number): Promise<BookingAvailability> {
  const { data } = await axiosInstance.get<BookingAvailability>(
    `/api/admin/booking/availability?${q(serviceTypeId)}`,
  );
  return data;
}

export async function upsertBookingDayOverride(
  serviceTypeId: number,
  body: { date: string; max_per_day?: number | null; is_closed: boolean },
): Promise<void> {
  await axiosInstance.put(`/api/admin/booking/day-overrides?${q(serviceTypeId)}`, body);
}

export async function deleteBookingDayOverride(serviceTypeId: number, date: string): Promise<void> {
  await axiosInstance.delete(`/api/admin/booking/day-overrides?${q(serviceTypeId)}&date=${date}`);
}

export interface BookingRequest {
  id: number;
  clinic_id: number;
  service_type_id: number;
  service_name?: string;
  requested_date: string;
  slot_time: string | null;
  client_name: string;
  client_phone: string;
  pet_name: string;
  pet_species: string | null;
  pet_age_years: number | null;
  telegram_user_id: number | null;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'rescheduled';
  staff_note: string | null;
  reject_reason: string | null;
  handled_by_user_id: number | null;
  rules_ack: unknown;
  created_at: string;
  updated_at: string;
}

export type BookingRequestInput = {
  service_type_id: number;
  requested_date: string;
  slot_time?: string | null;
  client_name: string;
  client_phone: string;
  pet_name: string;
  pet_species?: string | null;
  pet_age_years?: number | null;
  rules_ack?: unknown;
};

export type BookingRequestPatch = {
  status?: BookingRequest['status'];
  staff_note?: string | null;
  reject_reason?: string | null;
  requested_date?: string;
  slot_time?: string | null;
};

export async function getBookingRequests(params?: {
  status?: string;
  service_type_id?: number;
  from?: string;
  to?: string;
}): Promise<BookingRequest[]> {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.service_type_id) search.set('service_type_id', String(params.service_type_id));
  if (params?.from) search.set('from', params.from);
  if (params?.to) search.set('to', params.to);
  const qs = search.toString();
  const { data } = await axiosInstance.get<BookingRequest[]>(
    `/api/admin/booking/requests${qs ? `?${qs}` : ''}`,
  );
  return data;
}

export async function createBookingRequest(input: BookingRequestInput): Promise<BookingRequest> {
  const { data } = await axiosInstance.post<BookingRequest>('/api/admin/booking/requests', input);
  return data;
}

export async function updateBookingRequest(id: number, patch: BookingRequestPatch): Promise<BookingRequest> {
  const { data } = await axiosInstance.patch<BookingRequest>(`/api/admin/booking/requests/${id}`, patch);
  return data;
}
