import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@telegram-apps/telegram-ui';
import { fetchGroomingBreeds } from '../api';
import { useNotification } from '../hooks/useNotification';
import styles from './GroomingBreedsScreen.module.css';

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return 'По запросу';
  return `${price.toLocaleString('ru-RU')} ₽`;
}

export default function GroomingBreedsScreen() {
  const navigate = useNavigate();
  const notify = useNotification();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['grooming-breeds'],
    queryFn: fetchGroomingBreeds,
  });

  useEffect(() => {
    if (isError) notify('Не удалось загрузить список услуг. Попробуйте позже.', 'error');
  }, [isError, notify]);

  if (isLoading) return <Spinner size="m" />;

  return (
    <div className={styles.wrapper}>
      <p className={styles.header}>Услуги и породы</p>
      {(data ?? []).length === 0 && (
        <p className={styles.empty}>Услуги ещё не добавлены</p>
      )}
      {(data ?? []).map((breed) => (
        <div key={breed.id} className={styles.card}>
          <div className={styles.cardTop}>
            <span className={styles.breedName}>{breed.breed}</span>
            <span className={styles.price}>{formatPrice(breed.price)}</span>
          </div>
          <div className={styles.cardMeta}>
            <span className={styles.duration}>⏱ {formatDuration(breed.duration)}</span>
          </div>
          {breed.description && (
            <p className={styles.description}>{breed.description}</p>
          )}
        </div>
      ))}
      <button className={styles.back} onClick={() => navigate(-1)}>
        ‹ Назад
      </button>
    </div>
  );
}
