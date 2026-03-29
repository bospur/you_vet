import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Snackbar } from '@telegram-apps/telegram-ui';

type NotificationType = 'error' | 'success' | 'info';

interface Notification {
  message: string;
  type: NotificationType;
}

interface NotificationContextValue {
  notify: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<Notification | null>(null);

  const notify = useCallback((message: string, type: NotificationType = 'info') => {
    setNotification({ message, type });
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      {notification && (
        <Snackbar
          onClose={() => setNotification(null)}
          duration={3000}
          description={notification.message}
        >
          {notification.type === 'error' ? '❌' : notification.type === 'success' ? '✅' : 'ℹ️'}
        </Snackbar>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx.notify;
}
