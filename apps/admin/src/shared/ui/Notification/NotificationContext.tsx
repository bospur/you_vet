import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { Snackbar, Alert, type AlertColor } from '@mui/material';

interface Notification {
  id: number;
  message: string;
  severity: AlertColor;
}

interface NotificationContextValue {
  notify: (message: string, severity?: AlertColor) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

let nextId = 0;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((message: string, severity: AlertColor = 'info') => {
    const id = ++nextId;
    setNotifications((prev) => [...prev, { id, message, severity }]);
  }, []);

  const remove = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      {notifications.map((n) => (
        <Snackbar
          key={n.id}
          open
          autoHideDuration={4000}
          onClose={() => remove(n.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            severity={n.severity}
            onClose={() => remove(n.id)}
            variant="filled"
            sx={{ minWidth: 280 }}
          >
            {n.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
