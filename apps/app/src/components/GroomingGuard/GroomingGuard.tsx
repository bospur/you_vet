import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Preloader } from '../Preloader/Preloader';
import { useGroomingAvailable } from '../../hooks/useGroomingAvailable';

export function GroomingGuard() {
  const navigate = useNavigate();
  const { available, isLoading } = useGroomingAvailable();

  useEffect(() => {
    if (!isLoading && !available) {
      navigate('/', { replace: true });
    }
  }, [available, isLoading, navigate]);

  if (isLoading) return <Preloader />;
  if (!available) return null;
  return <Outlet />;
}
