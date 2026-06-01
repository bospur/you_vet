import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchBookingAvailability, fetchBookingServiceTypes } from '../../api';
import { Preloader } from '../../components/Preloader/Preloader';
import { useNotification } from '../../hooks/useNotification';
import { formatBookingDate } from '../../domain/booking/labels';
import styles from './booking.module.css';

function formatTimeRange(from: string | null, to: string | null): string | null {
  if (!from && !to) return null;
  const trim = (t: string) => t.slice(0, 5);
  if (from && to) return `Сдача ${trim(from)}–${trim(to)}`;
  if (from) return `С ${trim(from)}`;
  return `До ${trim(to!)}`;
}

export default function BookingDateScreen() {
  const navigate = useNavigate();
  const { serviceId } = useParams<{ serviceId: string }>();
  const serviceTypeId = Number(serviceId);
  const notify = useNotification();

  const servicesQuery = useQuery({
    queryKey: ['booking-service-types'],
    queryFn: fetchBookingServiceTypes,
  });

  const availabilityQuery = useQuery({
    queryKey: ['booking-availability', serviceTypeId],
    queryFn: () => fetchBookingAvailability(serviceTypeId),
    enabled: Number.isFinite(serviceTypeId) && serviceTypeId > 0,
  });

  const service = servicesQuery.data?.find((s) => s.id === serviceTypeId);
  const isLoading = servicesQuery.isLoading || availabilityQuery.isLoading;
  const isError = servicesQuery.isError || availabilityQuery.isError;

  useEffect(() => {
    if (isError) notify('Не удалось загрузить доступные даты.', 'error');
  }, [isError, notify]);

  if (isLoading) return <Preloader />;

  if (!service) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.empty}>Услуга не найдена</p>
        <button type="button" className={styles.back} onClick={() => navigate('/booking/new')}>
          ‹ Назад
        </button>
      </div>
    );
  }

  const openDays = (availabilityQuery.data?.days ?? []).filter(
    (d) => d.is_open && d.remaining > 0,
  );

  return (
    <div className={styles.wrapper}>
      <p className={styles.header}>{service.name}</p>
      {service.instructions_client && (
        <p className={styles.instructions}>{service.instructions_client}</p>
      )}
      {openDays.length === 0 ? (
        <p className={styles.empty}>Нет свободных дат в ближайшие недели</p>
      ) : (
        openDays.map((day) => {
          const timeHint = formatTimeRange(day.intake_from, day.intake_to);
          const pickupHint = day.pickup_after ? `Забор после ${day.pickup_after.slice(0, 5)}` : null;
          return (
            <button
              key={day.date}
              type="button"
              className={styles.dayRow}
              onClick={() => navigate(`/booking/new/${serviceTypeId}/date/${day.date}`)}
            >
              <div className={styles.cardTop}>
                <span className={styles.cardTitle}>{formatBookingDate(day.date)}</span>
                <span className={styles.remaining}>
                  {day.remaining} {day.remaining === 1 ? 'место' : day.remaining < 5 ? 'места' : 'мест'}
                </span>
              </div>
              {timeHint && <span className={styles.cardMeta}>{timeHint}</span>}
              {pickupHint && <span className={styles.cardMeta}>{pickupHint}</span>}
            </button>
          );
        })
      )}
      <button type="button" className={styles.back} onClick={() => navigate(-1)}>
        ‹ Назад
      </button>
    </div>
  );
}
