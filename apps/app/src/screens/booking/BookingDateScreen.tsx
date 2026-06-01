import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchBookingAvailability, fetchBookingServiceTypes, type BookingAvailabilityDay } from '../../api';
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
  const [pickDay, setPickDay] = useState<BookingAvailabilityDay | null>(null);

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

  const goToForm = (date: string, time?: string) => {
    const q = time ? `?time=${encodeURIComponent(time)}` : '';
    navigate(`/booking/new/${serviceTypeId}/date/${date}${q}`);
  };

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

  if (pickDay) {
    const slots = (pickDay.time_slots ?? []).filter((s) => s.remaining > 0);
    return (
      <div className={styles.wrapper}>
        <p className={styles.header}>{service.name}</p>
        <p className={styles.cardMeta}>{formatBookingDate(pickDay.date)}</p>
        <p className={styles.sectionTitle}>Выберите время</p>
        {slots.length === 0 ? (
          <p className={styles.empty}>Нет свободного времени</p>
        ) : (
          slots.map((slot) => (
            <button
              key={slot.time}
              type="button"
              className={styles.dayRow}
              onClick={() => goToForm(pickDay.date, slot.time)}
            >
              <span className={styles.cardTitle}>{slot.time.slice(0, 5)}</span>
            </button>
          ))
        )}
        <button type="button" className={styles.back} onClick={() => setPickDay(null)}>
          ‹ К выбору даты
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
          const hasSlots = day.slot_mode === 'fixed_times' && (day.time_slots?.length ?? 0) > 0;
          const placesLabel = hasSlots
            ? `${day.remaining} ${day.remaining === 1 ? 'слот' : day.remaining < 5 ? 'слота' : 'слотов'}`
            : `${day.remaining} ${day.remaining === 1 ? 'место' : day.remaining < 5 ? 'места' : 'мест'}`;

          return (
            <button
              key={day.date}
              type="button"
              className={styles.dayRow}
              onClick={() => {
                if (hasSlots) setPickDay(day);
                else goToForm(day.date);
              }}
            >
              <div className={styles.cardTop}>
                <span className={styles.cardTitle}>{formatBookingDate(day.date)}</span>
                <span className={styles.remaining}>{placesLabel}</span>
              </div>
              {timeHint && <span className={styles.cardMeta}>{timeHint}</span>}
              {pickupHint && <span className={styles.cardMeta}>{pickupHint}</span>}
              {hasSlots && <span className={styles.cardHint}>Нажмите, чтобы выбрать время</span>}
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
