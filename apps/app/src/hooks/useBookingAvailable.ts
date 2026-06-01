import { useQuery } from '@tanstack/react-query';
import { fetchBookingServiceTypes } from '../api';

/** Запись показываем, если есть хотя бы одна активная услуга. */
export function useBookingAvailable() {
  const query = useQuery({
    queryKey: ['booking-service-types'],
    queryFn: fetchBookingServiceTypes,
  });

  const services = query.data ?? [];
  const available = services.length > 0;

  return {
    available,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
