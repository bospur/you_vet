import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRoot } from '@telegram-apps/telegram-ui';
import './index.css';
import App from './App';
import { NotificationProvider } from './hooks/useNotification';
import { ErrorBoundary } from './components/ErrorBoundary';

window.Telegram?.WebApp?.ready();
window.Telegram?.WebApp?.expand();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export function Root() {
  const [appearance, setAppearance] = useState<'light' | 'dark'>(
    () => window.Telegram?.WebApp?.colorScheme ?? 'light',
  );

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    const handler = () => setAppearance(tg.colorScheme);
    tg.onEvent('themeChanged', handler);
    return () => tg.offEvent('themeChanged', handler);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppRoot appearance={appearance}>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </AppRoot>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
