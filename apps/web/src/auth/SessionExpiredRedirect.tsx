import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { onSessionExpired } from './sessionEvents';

const PROTECTED_PREFIXES = ['/profile', '/booking', '/question', '/chats', '/staff', '/grooming/book', '/grooming/requests'];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function SessionExpiredRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    return onSessionExpired(() => {
      queryClient.removeQueries({ queryKey: ['mobile-profile'] });
    });
  }, [queryClient]);

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    if (!isProtectedPath(location.pathname)) return;

    navigate(`/auth/login?return=${encodeURIComponent(location.pathname)}`, {
      replace: true,
    });
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  return null;
}
