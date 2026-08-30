import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchGroomingBreeds } from '../../api/content';
import { createGroomingAppointment, fetchGroomingAvailability } from '../../api/groomingBook';
import { useAuth } from '../../auth/AuthContext';
import { NestedAppBar } from '../../components/shell/AppBar';
import { Preloader } from '../../components/Preloader';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatRuPhone, isPhoneComplete, phoneDigitsOnly, phoneToApi } from '../../utils/phoneMask';
import styles from '../booking/booking.module.css';

function todayISO() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

export default function GroomingBookScreen() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login?return=/grooming/book', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  const queryClient = useQueryClient();
  const [breedId, setBreedId] = useState<number>(0);
  const [date, setDate] = useState(todayISO());
  const [startTime, setStartTime] = useState('');
  const [petName, setPetName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const breedsQuery = useQuery({ queryKey: ['grooming-breeds'], queryFn: fetchGroomingBreeds });
  const availQuery = useQuery({
    queryKey: ['grooming-avail', date, breedId],
    queryFn: () => fetchGroomingAvailability(date, breedId),
    enabled: breedId > 0 && Boolean(date),
    retry: false,
  });

  const openSlots = useMemo(
    () => (availQuery.data?.slots ?? []).filter((s) => s.available),
    [availQuery.data],
  );

  const mutation = useMutation({
    mutationFn: createGroomingAppointment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['grooming-mine'] });
      navigate('/grooming/requests', { replace: true });
    },
    onError: (err: unknown) => setError(getApiErrorMessage(err, 'Не удалось записаться')),
  });

  const canSubmit = breedId > 0 && date && startTime && petName.trim() && isPhoneComplete(phone);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    mutation.mutate({
      breed_id: breedId,
      date,
      start_time: startTime,
      pet_name: petName.trim(),
      owner_phone: phoneToApi(phone) || user?.phone || '',
    });
  };

  if (breedsQuery.isLoading) return <Preloader />;

  return (
    <>
      <NestedAppBar title="Запись на груминг" />
      <div className={styles.wrapper}>
        {error && <p className={styles.formError}>{error}</p>}
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>Услуга / порода</span>
            <select
              className={styles.input}
              value={breedId || ''}
              onChange={(e) => {
                setBreedId(Number(e.target.value));
                setStartTime('');
              }}
            >
              <option value="">Выберите</option>
              {(breedsQuery.data ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.breed} — {b.service_name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Дата</span>
            <input className={styles.input} type="date" value={date} min={todayISO()} onChange={(e) => { setDate(e.target.value); setStartTime(''); }} />
          </label>
          {availQuery.isError && <p className={styles.formError}>На эту дату груминг не работает</p>}
          {breedId > 0 && availQuery.data && (
            <div>
              <p className={styles.sectionTitle}>Свободное время</p>
              {openSlots.length === 0 ? (
                <p className={styles.empty}>Нет свободных слотов</p>
              ) : (
                openSlots.map((s) => (
                  <button
                    key={s.start_time}
                    type="button"
                    className={styles.dayRow}
                    onClick={() => setStartTime(s.start_time.slice(0, 5))}
                  >
                    <span className={styles.cardTitle}>
                      {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                      {startTime === s.start_time.slice(0, 5) ? ' · выбрано' : ''}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
          <label className={styles.field}>
            <span className={styles.label}>Кличка *</span>
            <input className={styles.input} value={petName} onChange={(e) => setPetName(e.target.value)} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Телефон *</span>
            <input
              className={styles.input}
              value={formatRuPhone(phone)}
              onChange={(e) => setPhone(phoneDigitsOnly(e.target.value))}
              placeholder="+7 (999) 123-45-67"
            />
          </label>
          <button type="submit" className={styles.submit} disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? 'Отправка…' : 'Записаться'}
          </button>
        </form>
        <button type="button" className={styles.back} onClick={() => navigate('/grooming')}>
          ‹ Назад
        </button>
      </div>
    </>
  );
}
