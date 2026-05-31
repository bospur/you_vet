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
