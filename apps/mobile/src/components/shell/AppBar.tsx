import { useNavigate } from 'react-router-dom';
import type { ClinicInfo } from '@you-vet/types';
import { API_URL } from '../../api/client';
import styles from './AppBar.module.css';

interface RootAppBarProps {
  info: ClinicInfo | null;
}

export function RootAppBar({ info }: RootAppBarProps) {
  const navigate = useNavigate();
  const phone = info?.phone?.replace(/\s/g, '');
  const logoUrl = info?.logo_url ? `${API_URL}${info.logo_url}` : null;

  return (
    <header className={styles.bar}>
      <button type="button" className={styles.titleBtn} onClick={() => navigate('/')}>
        {logoUrl && <img src={logoUrl} alt="" className={styles.logo} />}
        <span>{info?.name ?? 'Ветпрактика'}</span>
      </button>
      {phone && (
        <a href={`tel:${phone}`} className={styles.phoneBtn} aria-label="Позвонить">
          📞
        </a>
      )}
    </header>
  );
}

interface NestedAppBarProps {
  title: string;
  onBack?: () => void;
}

export function NestedAppBar({ title, onBack }: NestedAppBarProps) {
  const navigate = useNavigate();

  return (
    <header className={styles.bar}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={onBack ?? (() => navigate(-1))}
        >
          ‹ Назад
        </button>
        <span className={styles.center}>{title}</span>
      </div>
    </header>
  );
}
