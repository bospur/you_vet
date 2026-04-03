import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchClinicInfo } from '../api';
import type { ClinicInfo } from '../api';
import { NavGrid } from '../components/NavGrid/NavGrid';
import { IconFirstAid, IconDoctors, IconSchedule, IconGrooming } from '../components/NavGrid/icons';
import styles from './HomeScreen.module.css';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';
const BANNER_DISMISSED_KEY = 'banner_dismissed_v1';

export default function HomeScreen() {
  const navigate = useNavigate();
  const [info, setInfo] = useState<ClinicInfo | null>(null);
  const [bannerClosed, setBannerClosed] = useState(
    () => sessionStorage.getItem(BANNER_DISMISSED_KEY) === '1',
  );

  useEffect(() => {
    fetchClinicInfo().then(setInfo).catch(() => {});
  }, []);

  const handleCloseBanner = () => {
    sessionStorage.setItem(BANNER_DISMISSED_KEY, '1');
    setBannerClosed(true);
  };

  const navItems = [
    { key: 'animals', icon: <IconFirstAid />, label: 'Первая помощь', onClick: () => navigate('/animals') },
    { key: 'doctors', icon: <IconDoctors />, label: 'Наши врачи', onClick: () => navigate('/doctors') },
    { key: 'schedule', icon: <IconSchedule />, label: 'Расписание', onClick: () => navigate('/schedule') },
    { key: 'grooming', icon: <IconGrooming />, label: 'Груминг', onClick: () => navigate('/grooming') },
  ];

  const bannerUrl = info?.banner_url ? `${BASE_URL}${info.banner_url}` : null;
  const logoUrl = info?.logo_url ? `${BASE_URL}${info.logo_url}` : null;

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

      {/* Шапка клиники */}
      <div className={styles.header}>
        {logoUrl && (
          <img src={logoUrl} alt="logo" className={styles.logo} />
        )}
        <div className={styles.headerText}>
          <p className={styles.clinicName}>
            {info?.name || 'Ветеринарная клиника'}
          </p>
          {info?.description && (
            <p className={styles.description}>{info.description}</p>
          )}
        </div>
      </div>

      {/* Контактные данные */}
      {(info?.phone || info?.address) && (
        <div className={styles.contacts}>
          {info.phone && (
            <a href={`tel:${info.phone.replace(/\s/g, '')}`} className={styles.phoneBtn}>
              <span className={styles.phoneBtnIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C9.6 21 3 14.4 3 6c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" fill="currentColor"/>
                </svg>
              </span>
              Позвонить {info.phone}
            </a>
          )}
          {info.address && (
            <p className={styles.address}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="currentColor"/>
              </svg>
              {info.address}
            </p>
          )}
        </div>
      )}

      {/* Навигационная сетка */}
      <NavGrid items={navItems} />
    </div>
  );
}
