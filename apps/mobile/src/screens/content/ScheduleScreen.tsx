import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ScheduleEntry } from '../../api/content';
import { fetchSchedule } from '../../api/content';
import { NestedAppBar } from '../../components/shell/AppBar';
import { Preloader } from '../../components/Preloader';
import styles from './ScheduleScreen.module.css';

function groupByDate(slots: ScheduleEntry[]): Record<string, ScheduleEntry[]> {
  return slots.reduce<Record<string, ScheduleEntry[]>>((acc, slot) => {
    const key = slot.date.slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});
}

function formatChipDay(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = tomorrow.toISOString().slice(0, 10);
  const key = dateStr.slice(0, 10);
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
  const key = dateStr.slice(0, 10);
  const date = new Date(dateStr);
  const full = date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  if (key === today) return `Сегодня — ${full}`;
  if (key === tomorrowKey) return `Завтра — ${full}`;
  return full;
}

export default function ScheduleScreen() {
  const navigate = useNavigate();
  const todayKey = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['schedule'],
    queryFn: fetchSchedule,
  });

  if (isLoading) return <Preloader />;

  const emptyState = (message: string) => (
    <>
      <NestedAppBar title="Расписание" />
      <div className={styles.wrapper}>
        <p className={styles.empty}>{message}</p>
        <button type="button" className={styles.back} onClick={() => navigate('/')}>
          ‹ Назад
        </button>
      </div>
    </>
  );

  if (isError) return emptyState('Не удалось загрузить расписание');
  if (!data?.length) return emptyState('Расписание не добавлено');

  const upcoming = data
    .filter((s) => s.date.slice(0, 10) >= todayKey)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (!upcoming.length) return emptyState('Ближайших приёмов нет');

  const grouped = groupByDate(upcoming);
  const dates = Object.keys(grouped);
  const active = selectedDate ?? dates[0];
  const slots = grouped[active] ?? [];

  return (
    <>
      <NestedAppBar title="Расписание" />
      <div className={styles.wrapper}>
        <div className={styles.grid}>
          {dates.map((date) => (
            <button
              key={date}
              type="button"
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
                <span className={styles.slotTime}>
                  {slot.time_from.slice(0, 5)} — {slot.time_to.slice(0, 5)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button type="button" className={styles.back} onClick={() => navigate('/')}>
          ‹ Назад
        </button>
      </div>
    </>
  );
}
