import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ClinicInfo } from '@you-vet/types';
import { fetchClinicInfo } from '../api/clinic';
import { useAuth } from '../auth/AuthContext';
import { useAppRole } from '../auth/useAppRole';
import { AuthGuestBanner } from '../components/AuthGuestBanner';
import { ClinicPromoBanner } from '../components/ClinicPromoBanner';
import { DesktopHero } from '../components/DesktopHero';
import { FeaturedArticles } from '../components/FeaturedArticles';
import { HomeClinicBlock } from '../components/HomeClinicBlock';
import { Preloader } from '../components/Preloader';
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

const AUTH_ONLY_KEYS = new Set(['booking', 'booking-skeleton', 'question', 'staff-booking', 'staff-grooming']);

export default function HomeScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isStaff, isMedical, isGroomer } = useAppRole();
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
      ...(isAuthenticated && isMedical
        ? [{
            key: 'staff-booking',
            icon: <IconBooking />,
            label: 'Заявки',
            sub: 'подтвердить запись',
            to: '/staff/booking',
          }]
        : isAuthenticated && !isStaff && bookingLoading
        ? [{ key: 'booking-skeleton', label: '', sub: '', to: '', skeleton: true }]
        : isAuthenticated && !isStaff && bookingAvailable
          ? [{
              key: 'booking',
              icon: <IconBooking />,
              label: 'Записаться',
              sub: 'на приём',
              to: '/booking',
            }]
          : []),
      ...(isAuthenticated && isGroomer
        ? [{
            key: 'staff-grooming',
            icon: <IconGrooming />,
            label: 'Груминг',
            sub: 'записи на день',
            to: '/staff/grooming',
          }]
        : []),
      ...(isAuthenticated
        ? [{
            key: 'question',
            icon: <IconQuestion />,
            label: isStaff ? 'Чаты' : 'Написать врачу',
            sub: isStaff ? 'общий и треды' : 'чат с клиникой',
            to: '/chats',
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
    isStaff,
    isMedical,
    isGroomer,
  ]);

  if (isLoading && !clinic) {
    return <Preloader />;
  }

  return (
    <div className={styles.wrap}>
      {!isAuthenticated && !authLoading && (
        <div className={styles.guest}>
          <AuthGuestBanner />
        </div>
      )}
      <div className={styles.desktopHero}>
        <DesktopHero
          clinic={clinic}
          bookingAvailable={bookingAvailable}
          bookingLoading={bookingLoading}
          isAuthenticated={isAuthenticated}
        />
      </div>
      <div className={styles.mobileClinic}>
        <HomeClinicBlock clinic={clinic} />
      </div>

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
      <ClinicPromoBanner clinic={clinic} />
    </div>
  );
}
