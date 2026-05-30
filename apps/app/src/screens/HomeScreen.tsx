import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { ClinicInfo } from '../api';
import { HomeHero } from '../components/HomeHero/HomeHero';
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
    {
      key: 'animals',
      icon: <IconFirstAid />,
      label: 'Первая помощь',
      onClick: () => navigate('/animals'),
    },
    {
      key: 'doctors',
      icon: <IconDoctors />,
      label: 'Наши врачи',
      onClick: () => navigate('/doctors'),
    },
    {
      key: 'schedule',
      icon: <IconSchedule />,
      label: 'Расписание',
      onClick: () => navigate('/schedule'),
    },
    ...(!groomingLoading && groomingAvailable
      ? [{
          key: 'grooming',
          icon: <IconGrooming />,
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
