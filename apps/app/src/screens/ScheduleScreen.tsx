import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { List, Section, Cell } from '@telegram-apps/telegram-ui';
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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function ScheduleScreen() {
  const navigate = useNavigate();
  const notify = useNotification();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['schedule'],
    queryFn: fetchSchedule,
  });

  useEffect(() => {
    if (isError) notify('Не удалось загрузить расписание. Попробуйте позже.', 'error');
  }, [isError, notify]);

  const backBtn = (
    <button className={styles.back} onClick={() => navigate(-1)}>
      ‹ Назад
    </button>
  );

  if (isLoading) return <Preloader />;
  if (!data?.length) return (
    <>
      <List>
        <Section>
          <Cell>Расписание не добавлено</Cell>
        </Section>
      </List>
      {backBtn}
    </>
  );

  const grouped = groupByDate(data);

  return (
    <>
      <List>
      {Object.entries(grouped).map(([date, slots]) => (
        <Section key={date} header={formatDate(date)}>
          {slots.map((slot, i) => (
            <Cell
              key={i}
              subtitle={`${slot.time_from} — ${slot.time_to}`}
            >
              {slot.full_name}
            </Cell>
          ))}
        </Section>
      ))}
      </List>
      {backBtn}
    </>
  );
}
