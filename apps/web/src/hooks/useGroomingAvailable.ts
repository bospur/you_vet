import { useQueries } from '@tanstack/react-query';
import { fetchGroomingBreeds, fetchGroomingSchedule } from '../api/content';

export function useGroomingAvailable() {
  const [breedsQuery, scheduleQuery] = useQueries({
    queries: [
      { queryKey: ['grooming-breeds'], queryFn: fetchGroomingBreeds },
      { queryKey: ['grooming-schedule'], queryFn: fetchGroomingSchedule },
    ],
  });

  const breeds = breedsQuery.data ?? [];
  const schedule = scheduleQuery.data ?? [];

  return {
    available: breeds.length > 0 || schedule.length > 0,
    isLoading: breedsQuery.isLoading || scheduleQuery.isLoading,
    isError: breedsQuery.isError || scheduleQuery.isError,
  };
}
