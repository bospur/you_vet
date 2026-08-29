import { useEffect } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { SessionExpiredRedirect } from './auth/SessionExpiredRedirect';
import { sessionGet } from './lib/webStorage';
import { ThemeProvider } from './theme/ThemeContext';
import { AppRoutes } from './routes';

function BootRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== '/' || sessionGet('boot_v1') === '1') {
      return;
    }
    navigate('/splash', { replace: true });
  }, [location.pathname, navigate]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <BootRedirect />
          <SessionExpiredRedirect />
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
