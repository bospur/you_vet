import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { CatLogo } from '@you-vet/cat';
import { fetchClinicInfo } from '../../api';
import type { ClinicInfo } from '../../api';
import styles from './AppLayout.module.css';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export default function AppLayout() {
  const navigate = useNavigate();
  const [info, setInfo] = useState<ClinicInfo | null>(null);

  useEffect(() => {
    fetchClinicInfo().then(setInfo).catch(() => {});
  }, []);

  const logoUrl = info?.logo_url ? `${BASE_URL}${info.logo_url}` : null;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <a className={styles.logoLink} onClick={() => navigate('/')} role="button">
          {logoUrl
            ? <img src={logoUrl} alt="logo" className={styles.logo} />
            : <CatLogo />
          }
        </a>
        <p className={styles.clinicName}>
          {info?.name || 'Ветеринарная клиника'}
        </p>
        {info?.phone && (
          <a
            href={`tel:${info.phone.replace(/\s/g, '')}`}
            className={styles.callBtn}
            aria-label="Позвонить"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C9.6 21 3 14.4 3 6c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" fill="currentColor"/>
            </svg>
          </a>
        )}
      </header>

      <main className={styles.main}>
        <Outlet context={info} />
      </main>
    </div>
  );
}
