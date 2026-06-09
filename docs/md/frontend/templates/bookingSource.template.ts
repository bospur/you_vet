/**
 * Source layer — HTTP only. No React, no toast, no business logic.
 * Copy to: data/source/bookingSource.ts
 */
import axiosInstance from './axiosInstance';

// Raw API contract — suffix NetworkDTO
export type BookingServiceTypeNetworkDTO = {
  id: number;
  clinic_id: number;
  name: string;
  category: 'uzi' | 'surgery' | 'xray';
  is_active: boolean;
  sort_order: number;
};

export type CreateBookingServiceTypeNetworkInput = {
  name: string;
  category: BookingServiceTypeNetworkDTO['category'];
  is_active: boolean;
  sort_order: number;
};

export async function fetchBookingServiceTypes(): Promise<BookingServiceTypeNetworkDTO[]> {
  const { data } = await axiosInstance.get<BookingServiceTypeNetworkDTO[]>(
    '/api/admin/booking/service-types',
  );
  return data;
}

export async function postBookingServiceType(
  input: CreateBookingServiceTypeNetworkInput,
): Promise<BookingServiceTypeNetworkDTO> {
  const { data } = await axiosInstance.post<BookingServiceTypeNetworkDTO>(
    '/api/admin/booking/service-types',
    input,
  );
  return data;
}

export async function deleteBookingServiceType(id: number): Promise<void> {
  await axiosInstance.delete(`/api/admin/booking/service-types/${id}`);
}
