/**
 * Repository — OOP facade over source. Unwrap/map DTO.
 * Copy to: data/repositories/booking/BookingRepository.ts
 */
import {
  deleteBookingServiceType,
  fetchBookingServiceTypes,
  postBookingServiceType,
} from '../../source/bookingSource';
import {
  mapServiceTypeFromNetwork,
  type BookingServiceTypeDTO,
  type CreateBookingServiceTypeInput,
} from './dto';

class BookingRepository {
  async getServiceTypes(): Promise<BookingServiceTypeDTO[]> {
    const rows = await fetchBookingServiceTypes();
    return rows.map(mapServiceTypeFromNetwork);
  }

  async createServiceType(input: CreateBookingServiceTypeInput): Promise<BookingServiceTypeDTO> {
    const row = await postBookingServiceType(input);
    return mapServiceTypeFromNetwork(row);
  }

  async deleteServiceType(id: number): Promise<void> {
    await deleteBookingServiceType(id);
  }
}

export const bookingRepository = new BookingRepository();
