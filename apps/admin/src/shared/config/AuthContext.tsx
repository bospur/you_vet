import { createContext, useContext, useState, type ReactNode } from 'react';

const TOKEN_KEY = 'vp_admin_token';

interface AuthUser {
  id: number;
  clinicId: number;
  role: 'admin' | 'editor' | 'groomer';
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  saveToken: (token: string) => void;
  logout: () => void;
}

function decodeUser(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.user_id, clinicId: payload.clinic_id, role: payload.role };
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY),
  );
  const [user, setUser] = useState<AuthUser | null>(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    return t ? decodeUser(t) : null;
  });

  const saveToken = (t: string) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setUser(decodeUser(t));
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, saveToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
