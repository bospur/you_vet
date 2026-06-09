/**
 * Mutation hook — invalidate specific keys on success.
 * Copy to: data/repositories/booking/hooks/useCreateBookingServiceTypeMutation.ts
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingRepository } from '../BookingRepository';
import type { CreateBookingServiceTypeInput } from '../dto';
import { bookingKeys } from '../queryKeys';

export function useCreateBookingServiceTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBookingServiceTypeInput) => bookingRepository.createServiceType(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.serviceTypes() });
    },
  });
}
