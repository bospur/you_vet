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
  source: string;
  doctor_id: number | null;
  doctor_name: string | null;
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
    { slot_mode: 'day_capacity', ...body },
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
