import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Preloader } from './Preloader';
import { useGroomingAvailable } from '../hooks/useGroomingAvailable';

export function GroomingGuard({ children }: { children: ReactNode }) {
  const { available, isLoading } = useGroomingAvailable();

  if (isLoading) return <Preloader />;
  if (!available) return <Navigate to="/" replace />;

  return children;
}
