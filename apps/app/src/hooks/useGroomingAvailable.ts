import { useQueries } from '@tanstack/react-query';
import { fetchGroomingBreeds, fetchGroomingSchedule } from '../api';

/** Груминг показываем, если настроены породы или график (PRD-01). */
export function useGroomingAvailable() {
  const [breedsQuery, scheduleQuery] = useQueries({
    queries: [
      { queryKey: ['grooming-breeds'], queryFn: fetchGroomingBreeds },
      { queryKey: ['grooming-schedule'], queryFn: fetchGroomingSchedule },
    ],
  });

  const isLoading = breedsQuery.isLoading || scheduleQuery.isLoading;
  const isError = breedsQuery.isError || scheduleQuery.isError;

  const breeds = breedsQuery.data ?? [];
  const schedule = scheduleQuery.data ?? [];
  const available = breeds.length > 0 || schedule.length > 0;

  return { available, isLoading, isError };
}
