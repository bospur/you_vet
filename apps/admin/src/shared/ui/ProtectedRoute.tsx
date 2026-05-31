import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../config/AuthContext';
import { Loader } from './Loader';

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
