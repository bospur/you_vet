import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchBookingAvailability, fetchBookingServiceTypes } from '../../api/booking';
import { NestedAppBar } from '../../components/shell/AppBar';
import { Preloader } from '../../components/Preloader';
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

  const dayForTimeSelect = useMemo(() => {
    if (!selectDate || !availabilityQuery.data?.days) return null;
    return availabilityQuery.data.days.find((d) => d.date === selectDate) ?? null;
  }, [selectDate, availabilityQuery.data]);

  const goToForm = (date: string, time?: string) => {
    const q = time ? `?time=${encodeURIComponent(time)}` : '';
    navigate(`/booking/new/${serviceTypeId}/date/${date}${q}`);
  };

  if (isLoading) return <Preloader />;

  if (!service) {
    return (
      <>
        <NestedAppBar title="Дата" />
        <div className={styles.wrapper}>
          <p className={styles.empty}>Услуга не найдена</p>
          <button type="button" className={styles.back} onClick={() => navigate('/booking/new')}>
            ‹ Назад
          </button>
        </div>
      </>
    );
  }

  if (dayForTimeSelect) {
    const slots = availableSlotsForDay(dayForTimeSelect, service.default_duration_min);
    return (
      <>
        <NestedAppBar title={service.name} />
        <div className={styles.wrapper}>
          <p className={styles.cardMeta}>{formatBookingDate(dayForTimeSelect.date)}</p>
          <p className={styles.sectionTitle}>Выберите время</p>
          {slots.length === 0 ? (
            <p className={styles.empty}>Нет свободного времени</p>
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
          <button type="button" className={styles.back} onClick={() => setSearchParams({}, { replace: true })}>
            ‹ К выбору даты
          </button>
        </div>
      </>
    );
  }

  const openDays = (availabilityQuery.data?.days ?? []).filter((d) => {
    if (!d.is_open || d.remaining <= 0) return false;
    if (usesTimeSlots) return availableSlotsForDay(d, service.default_duration_min).length > 0;
    return true;
  });

  return (
    <>
      <NestedAppBar title={service.name} />
      <div className={styles.wrapper}>
        {service.instructions_client && (
          <p className={styles.instructions}>{service.instructions_client}</p>
        )}
        {openDays.length === 0 ? (
          <p className={styles.empty}>Нет свободных дат в ближайшие недели</p>
        ) : (
          openDays.map((day) => {
            const slotCount = usesTimeSlots
              ? availableSlotsForDay(day, service.default_duration_min).length
              : day.remaining;
            return (
              <button
                key={day.date}
                type="button"
                className={styles.dayRow}
                onClick={() => {
                  if (usesTimeSlots) setSearchParams({ selectDate: day.date });
                  else goToForm(day.date);
                }}
              >
                <div className={styles.cardTop}>
                  <span className={styles.cardTitle}>{formatBookingDate(day.date)}</span>
                  <span className={styles.remaining}>
                    {usesTimeSlots ? `${slotCount} слот.` : `${day.remaining} мест`}
                  </span>
                </div>
                {formatTimeRange(day.intake_from, day.intake_to) && (
                  <span className={styles.cardMeta}>{formatTimeRange(day.intake_from, day.intake_to)}</span>
                )}
              </button>
            );
          })
        )}
        <button type="button" className={styles.back} onClick={() => navigate(-1)}>
          ‹ Назад
        </button>
      </div>
    </>
  );
}
