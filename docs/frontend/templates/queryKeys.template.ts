/**
 * Query key factory — colocated with repository domain.
 * Copy to: data/repositories/booking/queryKeys.ts
 */
export const bookingKeys = {
  all: ['booking'] as const,
  serviceTypes: () => [...bookingKeys.all, 'service-types'] as const,
  weekly: (serviceTypeId: number) => [...bookingKeys.all, 'weekly', serviceTypeId] as const,
  requests: (filters?: { serviceTypeId?: number; status?: string }) =>
    [...bookingKeys.all, 'requests', filters ?? {}] as const,
};
