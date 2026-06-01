import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  createBookingRequest,
  fetchBookingServiceTypes,
} from '../../api';
import { Preloader } from '../../components/Preloader/Preloader';
import { useNotification } from '../../hooks/useNotification';
import { formatBookingDate } from '../../domain/booking/labels';
import styles from './booking.module.css';

export default function BookingFormScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notify = useNotification();
  const { serviceId, date } = useParams<{ serviceId: string; date: string }>();
  const [searchParams] = useSearchParams();
  const slotTime = searchParams.get('time') ?? undefined;
  const serviceTypeId = Number(serviceId);

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [petName, setPetName] = useState('');
  const [petAge, setPetAge] = useState('');

  const servicesQuery = useQuery({
    queryKey: ['booking-service-types'],
    queryFn: fetchBookingServiceTypes,
  });

  const service = servicesQuery.data?.find((s) => s.id === serviceTypeId);

  const mutation = useMutation({
    mutationFn: createBookingRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['booking-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['booking-availability', serviceTypeId] });
      notify('Заявка отправлена', 'success');
      navigate('/booking/requests', { replace: true });
    },
    onError: (err: unknown) => {
      let message = 'Не удалось отправить заявку';
      if (axios.isAxiosError(err) && typeof err.response?.data === 'string') {
        message = err.response.data;
      }
      notify(message, 'error');
    },
  });

  const needsTime = service?.schedule_style === 'time_slots';

  useEffect(() => {
    if (servicesQuery.isError) notify('Не удалось загрузить услугу.', 'error');
  }, [servicesQuery.isError, notify]);

  useEffect(() => {
    if (!servicesQuery.isLoading && service && date && needsTime && !slotTime) {
      navigate(`/booking/new/${serviceTypeId}/date?selectDate=${encodeURIComponent(date)}`, {
        replace: true,
      });
    }
  }, [servicesQuery.isLoading, service, date, needsTime, slotTime, serviceTypeId, navigate]);

  if (servicesQuery.isLoading) return <Preloader />;

  if (!service || !date) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.empty}>Неверная ссылка</p>
        <button type="button" className={styles.back} onClick={() => navigate('/booking')}>
          ‹ Назад
        </button>
      </div>
    );
  }

  if (needsTime && !slotTime) {
    return <Preloader />;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const age = petAge.trim() ? Number(petAge) : undefined;
    mutation.mutate({
      service_type_id: serviceTypeId,
      requested_date: date,
      ...(slotTime ? { slot_time: slotTime } : {}),
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      pet_name: petName.trim(),
      ...(age !== undefined && !Number.isNaN(age) ? { pet_age_years: age } : {}),
    });
  };

  const canSubmit =
    clientName.trim().length > 0 &&
    petName.trim().length > 0 &&
    (!needsTime || Boolean(slotTime)) &&
    !mutation.isPending;

  return (
    <div className={styles.wrapper}>
      <p className={styles.header}>Заявка</p>
      <div className={`${styles.card} ${styles.cardStatic}`}>
        <span className={styles.cardTitle}>{service.name}</span>
        <span className={styles.cardMeta}>
          {formatBookingDate(date)}
          {slotTime ? ` · ${slotTime.slice(0, 5)}` : ''}
        </span>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.label}>Ваше имя *</span>
          <input
            className={styles.input}
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            autoComplete="name"
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Телефон</span>
          <input
            className={styles.input}
            type="tel"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="+7..."
            autoComplete="tel"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Кличка питомца *</span>
          <input
            className={styles.input}
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Возраст питомца (лет)</span>
          <input
            className={styles.input}
            type="number"
            min={0}
            max={30}
            value={petAge}
            onChange={(e) => setPetAge(e.target.value)}
            inputMode="numeric"
          />
        </label>
        <button type="submit" className={styles.submit} disabled={!canSubmit}>
          {mutation.isPending ? 'Отправка…' : 'Отправить заявку'}
        </button>
      </form>

      <button type="button" className={styles.back} onClick={() => navigate(-1)}>
        ‹ Назад
      </button>
    </div>
  );
}
