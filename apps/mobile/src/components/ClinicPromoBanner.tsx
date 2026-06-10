import { useState } from 'react';
import type { ClinicInfo } from '@you-vet/types';
import { API_URL } from '../api/client';
import styles from './ClinicPromoBanner.module.css';

const BANNER_DISMISSED_KEY = 'banner_dismissed_v1';

interface ClinicPromoBannerProps {
  clinic: ClinicInfo | null;
}

export function ClinicPromoBanner({ clinic }: ClinicPromoBannerProps) {
  const [closed, setClosed] = useState(
    () => sessionStorage.getItem(BANNER_DISMISSED_KEY) === '1',
  );

  const bannerEnabled = clinic?.banner_enabled ?? false;
  const bannerUrl = clinic?.banner_url ? `${API_URL}${clinic.banner_url}` : null;
  const showBanner = bannerEnabled && !closed;

  if (!showBanner) return null;

  const handleClose = () => {
    sessionStorage.setItem(BANNER_DISMISSED_KEY, '1');
    setClosed(true);
  };

  return (
    <div className={styles.wrap}>
      {bannerUrl ? (
        <>
          <img src={bannerUrl} alt="" className={styles.banner} />
          <button
            type="button"
            className={styles.close}
            onClick={handleClose}
            aria-label="Закрыть баннер"
          >
            ✕
          </button>
        </>
      ) : (
        <div className={styles.placeholder} aria-hidden />
      )}
    </div>
  );
}
