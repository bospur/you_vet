import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './styles/global.css';

try {
  registerSW({ immediate: true });
} catch {
  /* iOS / private mode: SW optional */
}

try {
  if (localStorage.getItem('vet_theme') === 'dark') {
    document.documentElement.dataset.theme = 'dark';
  }
} catch {
  /* ignore */
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
