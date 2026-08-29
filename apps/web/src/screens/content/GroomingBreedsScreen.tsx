import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchGroomingBreeds } from '../../api/content';
import { NestedAppBar } from '../../components/shell/AppBar';
import { Preloader } from '../../components/Preloader';
import styles from './GroomingBreedsScreen.module.css';

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

function formatPrice(from: number | null, to: number | null): string {
  if (from == null && to == null) return 'По запросу';
  if (from != null && to != null && from !== to) {
    return `${from.toLocaleString('ru-RU')}–${to.toLocaleString('ru-RU')} ₽`;
  }
  const single = from ?? to;
  return single != null ? `${single.toLocaleString('ru-RU')} ₽` : 'По запросу';
}

export default function GroomingBreedsScreen() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['grooming-breeds'],
    queryFn: fetchGroomingBreeds,
  });

  const filtered = useMemo(() => {
    const list = data ?? [];
    const q = search.toLowerCase();
    return list.filter(
      (b) =>
        b.breed.toLowerCase().includes(q) ||
        (b.service_name?.toLowerCase().includes(q) ?? false),
    );
  }, [data, search]);

  if (isLoading) return <Preloader />;

  return (
    <>
      <NestedAppBar title="Услуги и породы" />
      <div className={styles.wrapper}>
        <input
          className={styles.search}
          type="search"
          placeholder="Поиск по породе…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {isError && <p className={styles.empty}>Не удалось загрузить список</p>}
        {!isError && filtered.length === 0 && (
          <p className={styles.empty}>
            {search ? 'Ничего не найдено' : 'Услуги ещё не добавлены'}
          </p>
        )}
        {filtered.map((breed) => {
          const showType =
            (data ?? []).filter((x) => x.breed === breed.breed).length > 1 &&
            breed.service_name !== 'Стрижка';
          return (
            <div key={breed.id} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.breedName}>
                  {breed.breed}
                  {showType ? ` · ${breed.service_name}` : ''}
                </span>
                <span className={styles.price}>{formatPrice(breed.price_from, breed.price_to)}</span>
              </div>
              <div className={styles.cardMeta}>
                <span className={styles.duration}>⏱ {formatDuration(breed.duration)}</span>
              </div>
              {breed.description && <p className={styles.description}>{breed.description}</p>}
            </div>
          );
        })}
        <button type="button" className={styles.back} onClick={() => navigate(-1)}>
          ‹ Назад
        </button>
      </div>
    </>
  );
}
