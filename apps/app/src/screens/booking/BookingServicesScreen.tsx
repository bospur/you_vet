import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchBookingServiceTypes } from '../../api';
import { Preloader } from '../../components/Preloader/Preloader';
import { useNotification } from '../../hooks/useNotification';
import {
  BOOKING_MODE_HINT,
  CATEGORY_LABELS,
  formatDuration,
  SPECIES_LABELS,
  type BookingCategory,
} from '../../domain/booking/labels';
import styles from './booking.module.css';

const CATEGORY_ORDER: BookingCategory[] = ['uzi', 'surgery', 'xray'];

export default function BookingServicesScreen() {
  const navigate = useNavigate();
  const notify = useNotification();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['booking-service-types'],
    queryFn: fetchBookingServiceTypes,
  });

  useEffect(() => {
    if (isError) notify('Не удалось загрузить услуги. Попробуйте позже.', 'error');
  }, [isError, notify]);

  const grouped = useMemo(() => {
    const services = data ?? [];
    return CATEGORY_ORDER.map((category) => ({
      category,
      label: CATEGORY_LABELS[category],
      items: services.filter((s) => s.category === category),
    })).filter((g) => g.items.length > 0);
  }, [data]);

  if (isLoading) return <Preloader />;

  return (
    <div className={styles.wrapper}>
      <p className={styles.header}>Выберите услугу</p>
      {grouped.length === 0 && (
        <p className={styles.empty}>Запись пока недоступна</p>
      )}
      {grouped.map((group) => (
        <div key={group.category} className={styles.listGroup}>
          <p className={styles.sectionTitle}>{group.label}</p>
          <div className={styles.cardList}>
            {group.items.map((service) => (
              <button
                key={service.id}
                type="button"
                className={styles.card}
                onClick={() => navigate(`/booking/new/${service.id}/date`)}
              >
                <div className={styles.cardTop}>
                  <span className={styles.cardTitle}>{service.name}</span>
                </div>
                <span className={styles.cardMeta}>
                  {SPECIES_LABELS[service.species_filter]} · {formatDuration(service.default_duration_min)}
                </span>
                <span className={styles.cardHint}>{BOOKING_MODE_HINT[service.booking_mode]}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
      <button type="button" className={styles.back} onClick={() => navigate(-1)}>
        ‹ Назад
      </button>
    </div>
  );
}
