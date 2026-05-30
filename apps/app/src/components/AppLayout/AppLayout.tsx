import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { fetchClinicInfo } from '../../api';
import type { ClinicInfo } from '../../api';
import { AppHeader } from '../AppHeader/AppHeader';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  const [info, setInfo] = useState<ClinicInfo | null>(null);

  useEffect(() => {
    fetchClinicInfo().then(setInfo).catch(() => {});
  }, []);

  return (
    <div className={styles.root}>
      <AppHeader info={info} />
      <main className={styles.main}>
        <Outlet context={info} />
      </main>
    </div>
  );
}
