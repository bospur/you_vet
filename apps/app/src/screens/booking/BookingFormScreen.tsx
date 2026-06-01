import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createBookingRequest,
  fetchBookingServiceTypes,
} from '../../api';
import { Preloader } from '../../components/Preloader/Preloader';
import { useNotification } from '../../hooks/useNotification';
import { formatBookingDate } from '../../domain/booking/labels';
import {
  getPetAgeWarning,
  isPetAgeRequired,
  parseBookingRules,
  shouldCollectPetAge,
} from '../../domain/booking/rules';
import { getApiErrorMessage } from '../../utils/apiError';
import {
  formatRuPhone,
  isPhoneComplete,
  phoneDigitsOnly,
  phoneToApi,
} from '../../utils/phoneMask';
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
  const [formError, setFormError] = useState<string | null>(null);

  const servicesQuery = useQuery({
    queryKey: ['booking-service-types'],
    queryFn: fetchBookingServiceTypes,
  });

  const service = servicesQuery.data?.find((s) => s.id === serviceTypeId);
  const rules = useMemo(() => parseBookingRules(service?.rules), [service?.rules]);
  const collectAge = shouldCollectPetAge(rules);
  const ageRequired = isPetAgeRequired(rules);

  const parsedAge = petAge.trim() === '' ? undefined : Number(petAge);
  const ageWarning = getPetAgeWarning(rules, parsedAge);
  const phoneComplete = isPhoneComplete(clientPhone);

  const needsTime = service?.schedule_style === 'time_slots';

  const formComplete = Boolean(
    service &&
    date &&
    clientName.trim().length > 0 &&
    petName.trim().length > 0 &&
    phoneComplete &&
    (!needsTime || Boolean(slotTime)) &&
    (!collectAge ||
      !ageRequired ||
      (petAge.trim() !== '' && parsedAge !== undefined && !Number.isNaN(parsedAge))),
  );

  const mutation = useMutation({
    mutationFn: createBookingRequest,
    onSuccess: () => {
      setFormError(null);
      void queryClient.invalidateQueries({ queryKey: ['booking-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['booking-availability', serviceTypeId] });
      notify('Заявка отправлена', 'success');
      navigate('/booking/requests', { replace: true });
    },
    onError: (err: unknown) => {
      const message = getApiErrorMessage(err, 'Не удалось отправить заявку');
      setFormError(message);
      notify(message, 'error');
    },
  });

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
    setFormError(null);

    if (!formComplete) {
      const msg = 'Заполните все поля формы';
      setFormError(msg);
      notify(msg, 'error');
      return;
    }

    mutation.mutate({
      service_type_id: serviceTypeId,
      requested_date: date,
      ...(slotTime ? { slot_time: slotTime } : {}),
      client_name: clientName.trim(),
      client_phone: phoneToApi(clientPhone),
      pet_name: petName.trim(),
      ...(parsedAge !== undefined && !Number.isNaN(parsedAge) ? { pet_age_years: parsedAge } : {}),
    });
  };

  const canSubmit = formComplete && !mutation.isPending;
  const showSubmitHint = !formComplete && !mutation.isPending;

  return (
    <div className={styles.wrapper}>
      <p className={styles.header}>Заявка</p>

      {formError && <p className={styles.formError}>{formError}</p>}

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
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Телефон *</span>
          <input
            className={`${styles.input} ${phoneComplete ? styles.inputPhoneComplete : styles.inputPhone}`}
            type="tel"
            value={formatRuPhone(clientPhone)}
            onChange={(e) => setClientPhone(phoneDigitsOnly(e.target.value))}
            placeholder="+7 (999) 123-45-67"
            autoComplete="tel"
            inputMode="tel"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Кличка питомца *</span>
          <input
            className={styles.input}
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
          />
        </label>
        {collectAge && (
          <label className={styles.field}>
            <span className={styles.label}>
              Возраст питомца (лет){ageRequired ? ' *' : ''}
            </span>
            <input
              className={styles.input}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={petAge}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                setPetAge(v);
              }}
            />
            {ageWarning && <p className={styles.ageWarn}>{ageWarning}</p>}
          </label>
        )}
        {showSubmitHint && (
          <p className={styles.submitHint}>Заполните все поля формы, чтобы отправить заявку</p>
        )}
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
