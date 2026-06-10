import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ClinicInfo } from '@you-vet/types';
import { fetchClinicInfo } from '../api/clinic';
import { useAuth } from '../auth/AuthContext';
import { AuthGuestBanner } from '../components/AuthGuestBanner';
import { FeaturedArticles } from '../components/FeaturedArticles';
import { HomeClinicBlock } from '../components/HomeClinicBlock';
import {
  IconBooking,
  IconDoctors,
  IconFirstAid,
  IconGrooming,
  IconQuestion,
  IconSchedule,
} from '../components/NavGrid/icons';
import { TodayAtClinic } from '../components/TodayAtClinic';
import type { ClinicOutletContext } from '../components/shell/AppShell';
import { useBookingAvailable } from '../hooks/useBookingAvailable';
import { useGroomingAvailable } from '../hooks/useGroomingAvailable';
import styles from './HomeScreen.module.css';

const AUTH_ONLY_KEYS = new Set(['booking', 'booking-skeleton', 'question']);

export default function HomeScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const cachedInfo = useOutletContext<ClinicOutletContext>();
  const { data: info, isLoading } = useQuery({
    queryKey: ['clinic-info'],
    queryFn: fetchClinicInfo,
    initialData: cachedInfo ?? undefined,
  });
  const { available: bookingAvailable, isLoading: bookingLoading } = useBookingAvailable();
  const { available: groomingAvailable, isLoading: groomingLoading } = useGroomingAvailable();

  const clinic: ClinicInfo | null = info ?? cachedInfo ?? null;

  const navCards = useMemo(() => {
    const cards: Array<{
      key: string;
      icon?: ReactNode;
      label: string;
      sub: string;
      to: string;
      skeleton?: boolean;
    }> = [
      ...(isAuthenticated && bookingLoading
        ? [{ key: 'booking-skeleton', label: '', sub: '', to: '', skeleton: true }]
        : isAuthenticated && bookingAvailable
          ? [{
              key: 'booking',
              icon: <IconBooking />,
              label: 'Записаться',
              sub: 'на приём',
              to: '/booking',
            }]
          : []),
      ...(isAuthenticated
        ? [{
            key: 'question',
            icon: <IconQuestion />,
            label: 'Задать вопрос',
            sub: 'ответ в боте',
            to: '/question',
          }]
        : []),
      {
        key: 'articles',
        icon: <IconFirstAid />,
        label: 'Статьи',
        sub: 'советы и помощь',
        to: '/animals',
      },
      {
        key: 'doctors',
        icon: <IconDoctors />,
        label: 'Врачи',
        sub: 'специалисты',
        to: '/doctors',
      },
      {
        key: 'schedule',
        icon: <IconSchedule />,
        label: 'Расписание',
        sub: 'часы приёма',
        to: '/schedule',
      },
      ...(groomingLoading
        ? [{ key: 'grooming-skeleton', label: '', sub: '', to: '', skeleton: true }]
        : groomingAvailable
          ? [{
              key: 'grooming',
              icon: <IconGrooming />,
              label: 'Груминг',
              sub: 'стрижка и уход',
              to: '/grooming',
            }]
          : []),
    ];

    if (!isAuthenticated && !authLoading) {
      return cards.filter((card) => !AUTH_ONLY_KEYS.has(card.key));
    }

    return cards;
  }, [
    authLoading,
    bookingAvailable,
    bookingLoading,
    groomingAvailable,
    groomingLoading,
    isAuthenticated,
  ]);

  if (isLoading && !clinic) {
    return <div className={styles.loading}>Загрузка…</div>;
  }

  return (
    <div className={styles.wrap}>
      {!isAuthenticated && !authLoading && <AuthGuestBanner />}
      <HomeClinicBlock clinic={clinic} />

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
    </div>
  );
}
