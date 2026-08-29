import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchClinicInfo } from '../api/clinic';

export function ClinicLayout() {
  const { data: info } = useQuery({
    queryKey: ['clinic-info'],
    queryFn: fetchClinicInfo,
    staleTime: 5 * 60 * 1000,
  });

  return <Outlet context={info ?? null} />;
}
