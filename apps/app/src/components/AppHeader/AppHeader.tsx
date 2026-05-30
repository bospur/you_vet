import { useNavigate } from 'react-router-dom';
import type { ClinicInfo } from '../../api';
import styles from './AppHeader.module.css';

interface AppHeaderProps {
  info: ClinicInfo | null;
}

export function AppHeader({ info }: AppHeaderProps) {
  const navigate = useNavigate();
  const phone = info?.phone?.replace(/\s/g, '');

  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.titleBtn}
        onClick={() => navigate('/')}
      >
        {info?.name || 'ВЕТПРАКТИКА'}
      </button>
      {phone && (
        <a href={`tel:${phone}`} className={styles.phoneBtn} aria-label="Позвонить">
          <svg width="40" height="42" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C9.6 21 3 14.4 3 6c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"
              fill="currentColor"
            />
          </svg>
        </a>
      )}
    </header>
  );
}
