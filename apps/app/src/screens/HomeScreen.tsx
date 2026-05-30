import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { ClinicInfo } from '../api';
import { NavGrid } from '../components/NavGrid/NavGrid';
import { IconFirstAid, IconDoctors, IconSchedule, IconGrooming } from '../components/NavGrid/icons';
import { useGroomingAvailable } from '../hooks/useGroomingAvailable';
import styles from './HomeScreen.module.css';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';
const BANNER_DISMISSED_KEY = 'banner_dismissed_v1';

export default function HomeScreen() {
  const navigate = useNavigate();
  const info = useOutletContext<ClinicInfo | null>();
  const { available: groomingAvailable, isLoading: groomingLoading } = useGroomingAvailable();
  const [bannerClosed, setBannerClosed] = useState(
    () => sessionStorage.getItem(BANNER_DISMISSED_KEY) === '1',
  );

  const handleCloseBanner = () => {
    sessionStorage.setItem(BANNER_DISMISSED_KEY, '1');
    setBannerClosed(true);
  };

  const navItems = [
    { key: 'animals', icon: <IconFirstAid />, label: 'Первая помощь', onClick: () => navigate('/animals') },
    { key: 'doctors', icon: <IconDoctors />, label: 'Наши врачи', onClick: () => navigate('/doctors') },
    { key: 'schedule', icon: <IconSchedule />, label: 'Расписание', onClick: () => navigate('/schedule') },
    ...(!groomingLoading && groomingAvailable
      ? [{ key: 'grooming', icon: <IconGrooming />, label: 'Груминг', onClick: () => navigate('/grooming') }]
      : []),
  ];

  const bannerUrl = info?.banner_url ? `${BASE_URL}${info.banner_url}` : null;

  return (
    <div className={styles.wrapper}>
      {/* Баннер — показываем если загружен и не закрыт в этой сессии */}
      {bannerUrl && !bannerClosed && (
        <div className={styles.bannerWrap}>
          <img src={bannerUrl} alt="banner" className={styles.banner} />
          <button className={styles.bannerClose} onClick={handleCloseBanner} aria-label="Закрыть баннер">
            ✕
          </button>
        </div>
      )}

      {/* Описание */}
      {info?.description && (
        <p className={styles.description}>{info.description}</p>
      )}

      {/* Адрес */}
      {info?.address && (
        <div className={styles.contacts}>
          <p className={styles.address}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="currentColor"/>
            </svg>
            {info.address}
          </p>
        </div>
      )}

      {/* Навигационная сетка */}
      <NavGrid items={navItems} />
    </div>
  );
}
