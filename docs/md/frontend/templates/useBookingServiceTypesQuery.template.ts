/**
 * React Query hook — thin wrapper over repository.
 * Copy to: data/repositories/booking/hooks/useBookingServiceTypesQuery.ts
 */
import { useQuery } from '@tanstack/react-query';
import { DEFAULT_CACHE_LIFETIME_MS } from '../../../shared/constants/cache';
import { bookingRepository } from '../BookingRepository';
import { bookingKeys } from '../queryKeys';

export function useBookingServiceTypesQuery() {
  return useQuery({
    queryKey: bookingKeys.serviceTypes(),
    queryFn: () => bookingRepository.getServiceTypes(),
    staleTime: DEFAULT_CACHE_LIFETIME_MS,
  });
}
