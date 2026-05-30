import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { ClinicInfo } from '../api';
import { HomeHero } from '../components/HomeHero/HomeHero';
import { NavGrid } from '../components/NavGrid/NavGrid';
import { useGroomingAvailable } from '../hooks/useGroomingAvailable';
import iconFirstAid from '../assets/home/icon-first-aid.png';
import iconSchedule from '../assets/home/icon-schedule.png';
import iconGrooming from '../assets/home/icon-grooming.png';
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
    {
      key: 'animals',
      icon: <img src={iconFirstAid} alt="" className={styles.navIcon} />,
      label: 'Первая помощь',
      onClick: () => navigate('/animals'),
    },
    {
      key: 'doctors',
      label: 'Наши врачи',
      onClick: () => navigate('/doctors'),
    },
    {
      key: 'schedule',
      icon: <img src={iconSchedule} alt="" className={styles.navIcon} />,
      label: 'Расписание',
      onClick: () => navigate('/schedule'),
    },
    ...(!groomingLoading && groomingAvailable
      ? [{
          key: 'grooming',
          icon: <img src={iconGrooming} alt="" className={styles.navIcon} />,
          label: 'Груминг',
          onClick: () => navigate('/grooming'),
        }]
      : []),
  ];

  const bannerUrl = info?.banner_url ? `${BASE_URL}${info.banner_url}` : null;
  const bannerEnabled = info?.banner_enabled ?? false;
  const showBannerImage = bannerEnabled && bannerUrl && !bannerClosed;
  const showBannerPlaceholder = bannerEnabled && !showBannerImage;

  return (
    <div className={styles.wrapper}>
      <HomeHero info={info} />

      {bannerEnabled && (
        <div className={styles.bannerWrap}>
          {showBannerImage ? (
            <>
              <img src={bannerUrl} alt="banner" className={styles.banner} />
              <button className={styles.bannerClose} onClick={handleCloseBanner} aria-label="Закрыть баннер">
                ✕
              </button>
            </>
          ) : showBannerPlaceholder ? (
            <div className={styles.bannerPlaceholder} aria-hidden />
          ) : null}
        </div>
      )}

      <NavGrid items={navItems} />
    </div>
  );
}
