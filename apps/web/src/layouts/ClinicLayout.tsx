import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchClinicInfo } from '../api/clinic';
import { Preloader } from '../components/Preloader';

export function ClinicLayout() {
  const { data: info, isPending } = useQuery({
    queryKey: ['clinic-info'],
    queryFn: fetchClinicInfo,
    staleTime: 5 * 60 * 1000,
  });

  if (isPending) {
    return <Preloader full />;
  }

  return <Outlet context={info ?? null} />;
}
