import { useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ClinicInfo } from '@you-vet/types';
import { fetchClinicInfo } from '../api/clinic';
import { FeaturedArticles } from '../components/FeaturedArticles';
import { TodayAtClinic } from '../components/TodayAtClinic';
import type { ClinicOutletContext } from '../components/shell/AppShell';
import { useBookingAvailable } from '../hooks/useBookingAvailable';
import { useGroomingAvailable } from '../hooks/useGroomingAvailable';
import styles from './HomeScreen.module.css';

export default function HomeScreen() {
  const navigate = useNavigate();
  const cachedInfo = useOutletContext<ClinicOutletContext>();
  const { data: info, isLoading } = useQuery({
    queryKey: ['clinic-info'],
    queryFn: fetchClinicInfo,
    initialData: cachedInfo ?? undefined,
  });
  const { available: bookingAvailable, isLoading: bookingLoading } = useBookingAvailable();
  const { available: groomingAvailable, isLoading: groomingLoading } = useGroomingAvailable();

  const clinic: ClinicInfo | null = info ?? cachedInfo ?? null;
  const phone = clinic?.phone?.replace(/\s/g, '');

  if (isLoading && !clinic) {
    return <div className={styles.loading}>Загрузка…</div>;
  }

  const navCards: Array<{
    key: string;
    icon: string;
    label: string;
    sub: string;
    to: string;
    skeleton?: boolean;
  }> = [
    ...(bookingLoading
      ? [{ key: 'booking-skeleton', icon: '', label: '', sub: '', to: '', skeleton: true }]
      : bookingAvailable
        ? [{ key: 'booking', icon: '📅', label: 'Записаться', sub: 'на приём', to: '/booking' }]
        : []),
    { key: 'question', icon: '💬', label: 'Задать вопрос', sub: 'ответ в боте', to: '/question' },
    { key: 'articles', icon: '📚', label: 'Статьи', sub: 'советы и помощь', to: '/animals' },
    { key: 'doctors', icon: '👨‍⚕️', label: 'Врачи', sub: 'специалисты', to: '/doctors' },
    { key: 'schedule', icon: '🗓', label: 'Расписание', sub: 'часы приёма', to: '/schedule' },
    ...(groomingLoading
      ? [{ key: 'grooming-skeleton', icon: '', label: '', sub: '', to: '', skeleton: true }]
      : groomingAvailable
        ? [{ key: 'grooming', icon: '✂️', label: 'Груминг', sub: 'стрижка и уход', to: '/grooming' }]
        : []),
  ];

  return (
    <div className={styles.wrap}>
      <section className={styles.hero}>
        <h2 className={styles.heroTitle}>{clinic?.name ?? 'Ветпрактика'}</h2>
        {clinic?.address && <p className={styles.heroMeta}>{clinic.address}</p>}
        {clinic?.description && (
          <p className={styles.heroMeta}>{clinic.description.slice(0, 200)}…</p>
        )}
      </section>

      <h3 className={styles.sectionTitle}>Полезное</h3>
      <div className={styles.grid}>
        {navCards.map((card) =>
          card.skeleton ? (
            <div key={card.key} className={styles.cardSkeleton} aria-hidden />
          ) : (
            <button
              key={card.key}
              type="button"
              className={styles.card}
              onClick={() => navigate(card.to)}
            >
              <span className={styles.cardIcon}>{card.icon}</span>
              <span className={styles.cardLabel}>{card.label}</span>
              <span className={styles.cardSub}>{card.sub}</span>
            </button>
          ),
        )}
      </div>

      <TodayAtClinic />
      <FeaturedArticles />

      {phone && (
        <a href={`tel:${phone}`} className={styles.callBar}>
          📞 Позвонить в клинику
        </a>
      )}
    </div>
  );
}
