import { useEffect } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { VkDeepLinkHandler } from './auth/VkDeepLinkHandler';
import { AppRoutes } from './routes';

function BootRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== '/' || sessionStorage.getItem('boot_v1') === '1') {
      return;
    }
    navigate('/splash', { replace: true });
  }, [location.pathname, navigate]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <BootRedirect />
        <VkDeepLinkHandler />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
