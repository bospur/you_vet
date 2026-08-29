import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchClinicInfo } from '../api/clinic';
import { Preloader } from '../components/Preloader';
import { applyClinicBranding } from '../lib/clinicBranding';

export function ClinicLayout() {
  const { data: info, isPending } = useQuery({
    queryKey: ['clinic-info'],
    queryFn: fetchClinicInfo,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    applyClinicBranding(info ?? null);
  }, [info]);

  if (isPending) {
    return <Preloader full />;
  }

  return <Outlet context={info ?? null} />;
}
