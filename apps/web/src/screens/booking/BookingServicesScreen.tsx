import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchBookingServiceTypes } from '../../api/booking';
import { NestedAppBar } from '../../components/shell/AppBar';
import { Preloader } from '../../components/Preloader';
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
  const { data, isLoading } = useQuery({
    queryKey: ['booking-service-types'],
    queryFn: fetchBookingServiceTypes,
  });

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
    <>
      <NestedAppBar title="Выбор услуги" />
      <div className={styles.wrapper}>
        {grouped.length === 0 && <p className={styles.empty}>Запись пока недоступна</p>}
        {grouped.map((group) => (
          <div key={group.category}>
            <p className={styles.sectionTitle}>{group.label}</p>
            {group.items.map((service) => (
              <button
                key={service.id}
                type="button"
                className={styles.card}
                onClick={() => navigate(`/booking/new/${service.id}/date`)}
              >
                <span className={styles.cardTitle}>{service.name}</span>
                <span className={styles.cardMeta}>
                  {SPECIES_LABELS[service.species_filter]} · {formatDuration(service.default_duration_min)}
                </span>
                <span className={styles.cardHint}>{BOOKING_MODE_HINT[service.booking_mode]}</span>
              </button>
            ))}
          </div>
        ))}
        <button type="button" className={styles.back} onClick={() => navigate('/booking')}>
          ‹ Назад
        </button>
      </div>
    </>
  );
}
