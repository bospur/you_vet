import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchCurrentUser, logoutRequest, type AuthUserResponse } from '../../data/source/auth';

export interface AuthUser {
  id: number;
  clinicId: number;
  role: 'admin' | 'editor' | 'groomer';
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  establishSession: (user: AuthUserResponse) => void;
  logout: () => Promise<void>;
}

function mapUser(raw: AuthUserResponse): AuthUser {
  return { id: raw.id, clinicId: raw.clinic_id, role: raw.role };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchCurrentUser()
      .then((raw) => {
        if (!cancelled) setUser(mapUser(raw));
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const establishSession = (raw: AuthUserResponse) => {
    setUser(mapUser(raw));
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } catch {
      // cookie may already be cleared
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, establishSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
