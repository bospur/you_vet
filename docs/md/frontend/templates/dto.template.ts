/**
 * Domain DTOs for repository layer.
 * Copy to: data/repositories/booking/dto.ts
 */
import type { BookingServiceTypeNetworkDTO } from '../../source/bookingSource';

export type BookingServiceTypeDTO = BookingServiceTypeNetworkDTO;

export type CreateBookingServiceTypeInput = {
  name: string;
  category: BookingServiceTypeDTO['category'];
  is_active: boolean;
  sort_order: number;
};

export function mapServiceTypeFromNetwork(row: BookingServiceTypeNetworkDTO): BookingServiceTypeDTO {
  return row;
}
