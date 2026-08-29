import { useQuery } from '@tanstack/react-query';
import { fetchBookingServiceTypes } from '../api/content';

export function useBookingAvailable() {
  const query = useQuery({
    queryKey: ['booking-service-types'],
    queryFn: fetchBookingServiceTypes,
  });

  const services = query.data ?? [];

  return {
    available: services.length > 0,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
