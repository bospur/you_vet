import { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchBookingAvailability, fetchBookingServiceTypes } from '../../api';
import { Preloader } from '../../components/Preloader/Preloader';
import { useNotification } from '../../hooks/useNotification';
import { formatBookingDate } from '../../domain/booking/labels';
import { availableSlotsForDay } from '../../domain/booking/timeSlots';
import styles from './booking.module.css';

function formatTimeRange(from: string | null, to: string | null): string | null {
  if (!from && !to) return null;
  const trim = (t: string) => t.slice(0, 5);
  if (from && to) return `Приём ${trim(from)}–${trim(to)}`;
  if (from) return `С ${trim(from)}`;
  return `До ${trim(to!)}`;
}

export default function BookingDateScreen() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { serviceId } = useParams<{ serviceId: string }>();
  const serviceTypeId = Number(serviceId);
  const selectDate = searchParams.get('selectDate');
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
  const usesTimeSlots = service?.schedule_style === 'time_slots';
  const isLoading = servicesQuery.isLoading || availabilityQuery.isLoading;
  const isError = servicesQuery.isError || availabilityQuery.isError;

  const dayForTimeSelect = useMemo(() => {
    if (!selectDate || !availabilityQuery.data?.days) return null;
    return availabilityQuery.data.days.find((d) => d.date === selectDate) ?? null;
  }, [selectDate, availabilityQuery.data]);

  useEffect(() => {
    if (isError) notify('Не удалось загрузить доступные даты.', 'error');
  }, [isError, notify]);

  const goToForm = (date: string, time?: string) => {
    const q = time ? `?time=${encodeURIComponent(time)}` : '';
    navigate(`/booking/new/${serviceTypeId}/date/${date}${q}`);
  };

  const clearTimeSelect = () => setSearchParams({}, { replace: true });

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

  if (dayForTimeSelect) {
    const slots = availableSlotsForDay(dayForTimeSelect, service.default_duration_min);
    const timeHint = formatTimeRange(dayForTimeSelect.intake_from, dayForTimeSelect.intake_to);

    return (
      <div className={styles.wrapper}>
        <p className={styles.header}>{service.name}</p>
        <p className={styles.cardMeta}>{formatBookingDate(dayForTimeSelect.date)}</p>
        {timeHint && <p className={styles.instructions}>{timeHint}</p>}
        <p className={styles.sectionTitle}>Выберите время</p>
        {slots.length === 0 ? (
          <p className={styles.empty}>
            Нет свободного времени. Проверьте в админке шаблон недели: режим «Выбор времени» и окно «С»–«До».
          </p>
        ) : (
          slots.map((slot) => (
            <button
              key={slot.time}
              type="button"
              className={styles.dayRow}
              onClick={() => goToForm(dayForTimeSelect.date, slot.time)}
            >
              <span className={styles.cardTitle}>{slot.time.slice(0, 5)}</span>
            </button>
          ))
        )}
        <button type="button" className={styles.back} onClick={clearTimeSelect}>
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
          const slotCount = usesTimeSlots
            ? availableSlotsForDay(day, service.default_duration_min).length
            : day.remaining;
          const placesLabel = usesTimeSlots
            ? `${slotCount} ${slotCount === 1 ? 'слот' : slotCount < 5 ? 'слота' : 'слотов'}`
            : `${day.remaining} ${day.remaining === 1 ? 'место' : day.remaining < 5 ? 'места' : 'мест'}`;

          return (
            <button
              key={day.date}
              type="button"
              className={styles.dayRow}
              onClick={() => {
                if (usesTimeSlots) {
                  setSearchParams({ selectDate: day.date });
                } else {
                  goToForm(day.date);
                }
              }}
            >
              <div className={styles.cardTop}>
                <span className={styles.cardTitle}>{formatBookingDate(day.date)}</span>
                <span className={styles.remaining}>{placesLabel}</span>
              </div>
              {timeHint && <span className={styles.cardMeta}>{timeHint}</span>}
              {pickupHint && <span className={styles.cardMeta}>{pickupHint}</span>}
              {usesTimeSlots && slotCount > 0 && (
                <span className={styles.cardHint}>Нажмите, чтобы выбрать время</span>
              )}
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
