import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchSchedule } from '../api';
import type { ScheduleEntry } from '../api';
import { useNotification } from '../hooks/useNotification';
import { Preloader } from '../components/Preloader/Preloader';
import styles from './ScheduleScreen.module.css';

function groupByDate(slots: ScheduleEntry[]): Record<string, ScheduleEntry[]> {
  return slots.reduce<Record<string, ScheduleEntry[]>>((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});
}

function toDateOnly(dateStr: string): string {
  return dateStr.slice(0, 10);
}

function formatChipDay(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = tomorrow.toISOString().slice(0, 10);
  const key = toDateOnly(dateStr);
  if (key === today) return 'Сегодня';
  if (key === tomorrowKey) return 'Завтра';
  return new Date(dateStr).toLocaleDateString('ru-RU', { weekday: 'short' });
}

function formatChipDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function formatFullDate(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = tomorrow.toISOString().slice(0, 10);
  const key = toDateOnly(dateStr);
  const date = new Date(dateStr);
  const full = date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  if (key === today) return `Сегодня — ${full}`;
  if (key === tomorrowKey) return `Завтра — ${full}`;
  return full;
}

export default function ScheduleScreen() {
  const navigate = useNavigate();
  const notify = useNotification();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['schedule'],
    queryFn: fetchSchedule,
  });

  const todayKey = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (isError) notify('Не удалось загрузить расписание. Попробуйте позже.', 'error');
  }, [isError, notify]);

  if (isLoading) return <Preloader />;

  if (!data?.length) return (
    <div className={styles.wrapper}>
      <p className={styles.empty}>Расписание не добавлено</p>
      <button className={styles.back} onClick={() => navigate(-1)}>‹ Назад</button>
    </div>
  );

  const upcoming = data
    .filter((s) => toDateOnly(s.date) >= todayKey)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (!upcoming.length) return (
    <div className={styles.wrapper}>
      <p className={styles.empty}>Ближайших приёмов нет</p>
      <button className={styles.back} onClick={() => navigate(-1)}>‹ Назад</button>
    </div>
  );

  const grouped = groupByDate(upcoming);
  const dates = Object.keys(grouped);
  const active = selectedDate ?? dates[0];
  const slots = grouped[active] ?? [];

  return (
    <div className={styles.wrapper}>
      <p className={styles.header}>Расписание врачей</p>

      <div className={styles.grid}>
        {dates.map((date) => (
          <button
            key={date}
            className={`${styles.chip} ${date === active ? styles.chipActive : ''}`}
            onClick={() => setSelectedDate(date)}
          >
            <span className={styles.chipDay}>{formatChipDay(date)}</span>
            <span className={styles.chipDate}>{formatChipDate(date)}</span>
          </button>
        ))}
      </div>

      <div className={styles.slotsCard}>
        <div className={styles.slotsHeader}>{formatFullDate(active)}</div>
        <div className={styles.slots}>
          {slots.map((slot, i) => (
            <div key={i} className={styles.slot}>
              <span className={styles.slotName}>{slot.full_name}</span>
              <span className={styles.slotTime}>{slot.time_from.slice(0, 5)} — {slot.time_to.slice(0, 5)}</span>
            </div>
          ))}
        </div>
      </div>

      <button className={styles.back} onClick={() => navigate(-1)}>‹ Назад</button>
    </div>
  );
}
