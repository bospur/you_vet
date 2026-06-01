import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import styles from './useNotification.module.css';

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
    window.setTimeout(() => setNotification(null), 4000);
  }, []);

  const typeClass =
    notification?.type === 'error'
      ? styles.error
      : notification?.type === 'success'
        ? styles.success
        : styles.info;

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      {notification && (
        <div className={`${styles.toast} ${typeClass}`} role="alert">
          {notification.message}
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx.notify;
}
