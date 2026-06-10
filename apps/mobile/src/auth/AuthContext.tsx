import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { onSessionExpired } from './sessionEvents';
import { parseMobileAccessToken, type MobileUserProfile } from './mobileUser';
import { clearTokens, getAccessToken } from './tokenStorage';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: MobileUserProfile | null;
  logout: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<MobileUserProfile | null>(null);

  const applyToken = useCallback((token: string | null) => {
    setIsAuthenticated(Boolean(token));
    setUser(token ? parseMobileAccessToken(token) : null);
    setIsLoading(false);
  }, []);

  const refreshAuthState = useCallback(async () => {
    const token = await getAccessToken();
    applyToken(token);
  }, [applyToken]);

  useEffect(() => {
    let cancelled = false;
    getAccessToken().then((token) => {
      if (cancelled) return;
      applyToken(token);
    });
    return () => {
      cancelled = true;
    };
  }, [applyToken]);

  useEffect(() => {
    return onSessionExpired(() => {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
    });
  }, []);

  const logout = useCallback(async () => {
    await clearTokens();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, isLoading, user, logout, refreshAuthState }),
    [isAuthenticated, isLoading, user, logout, refreshAuthState],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
