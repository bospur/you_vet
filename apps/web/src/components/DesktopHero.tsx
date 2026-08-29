import { useNavigate } from 'react-router-dom';
import type { ClinicInfo } from '@you-vet/types';
import styles from './DesktopHero.module.css';

const FALLBACK_SUB =
  'Запись, статьи и врачи клиники в одном окне. Как в телефоне, только удобнее на большом экране.';

interface DesktopHeroProps {
  clinic: ClinicInfo | null;
  bookingAvailable: boolean;
  bookingLoading: boolean;
  isAuthenticated: boolean;
}

export function DesktopHero({
  clinic,
  bookingAvailable,
  bookingLoading,
  isAuthenticated,
}: DesktopHeroProps) {
  const navigate = useNavigate();
  const subtitle = clinic?.description?.trim() || FALLBACK_SUB;

  const onCta = () => {
    if (isAuthenticated) {
      navigate('/booking');
      return;
    }
    navigate('/auth/login?return=/booking');
  };

  return (
    <section className={styles.hero}>
      <h1 className={styles.title}>Забота о питомце — без очереди в Telegram</h1>
      <p className={styles.sub}>{subtitle}</p>
      {bookingLoading ? (
        <span className={styles.ctaSkeleton} aria-hidden />
      ) : bookingAvailable ? (
        <button type="button" className={styles.cta} onClick={onCta}>
          Записаться на приём
        </button>
      ) : null}
    </section>
  );
}
