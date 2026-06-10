import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { fetchClinicInfo } from '../api/clinic';
import splashBg from '../assets/splash-bg.png';
import { hideNativeSplash } from '../lib/nativeSplash';
import styles from './SplashScreen.module.css';

const MIN_SPLASH_MS = 800;

export default function SplashScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    void hideNativeSplash();
  }, []);

  useEffect(() => {
    const started = Date.now();

    const bootstrap = async () => {
      try {
        await queryClient.prefetchQuery({
          queryKey: ['clinic-info'],
          queryFn: fetchClinicInfo,
        });
      } catch {
        // главная покажет ошибку
      }

      const elapsed = Date.now() - started;
      const delay = Math.max(0, MIN_SPLASH_MS - elapsed);
      sessionStorage.setItem('boot_v1', '1');
      window.setTimeout(() => navigate('/', { replace: true }), delay);
    };

    void bootstrap();
  }, [navigate, queryClient]);

  return (
    <div className={styles.wrap} style={{ backgroundImage: `url(${splashBg})` }}>
      <div className={styles.spinner} aria-label="Загрузка" />
    </div>
  );
}
