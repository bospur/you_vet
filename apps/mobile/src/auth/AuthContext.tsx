import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { clearTokens, getAccessToken } from './tokenStorage';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuthState = useCallback(async () => {
    const token = await getAccessToken();
    setIsAuthenticated(Boolean(token));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getAccessToken().then((token) => {
      if (cancelled) return;
      setIsAuthenticated(Boolean(token));
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    await clearTokens();
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, isLoading, logout, refreshAuthState }),
    [isAuthenticated, isLoading, logout, refreshAuthState],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
