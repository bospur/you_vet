import { useQuery } from '@tanstack/react-query';
import { fetchProfile } from '../api/profile';
import { useAuth } from '../auth/AuthContext';

export function useMobileProfile() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['mobile-profile'],
    queryFn: fetchProfile,
    enabled: isAuthenticated && !authLoading,
    retry: 1,
    staleTime: 30_000,
  });
}
