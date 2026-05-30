import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchSchedule } from '../../api';
import { hapticLight } from '../../utils/haptic';
import styles from './TodayAtClinic.module.css';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDoctorCount(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} врачей`;
  if (mod10 === 1) return `${n} врач`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} врача`;
  return `${n} врачей`;
}

export function TodayAtClinic() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['schedule'],
    queryFn: fetchSchedule,
  });

  if (isLoading) {
    return <div className={styles.skeleton} aria-hidden />;
  }

  const key = todayKey();
  const todaySlots = (data ?? []).filter((s) => s.date.slice(0, 10) === key);
  if (!todaySlots.length) return null;

  const byDoctor = new Map<number, string>();
  for (const slot of todaySlots) {
    byDoctor.set(slot.doctor_id, slot.full_name);
  }
  const names = [...byDoctor.values()];
  const count = names.length;

  let label: string;
  if (count === 1) {
    label = `Сегодня принимает: ${names[0]}`;
  } else if (count === 2) {
    label = `Сегодня в клинике: ${names[0]} и ${names[1]}`;
  } else {
    label = `Сегодня в клинике: ${formatDoctorCount(count)}`;
  }

  return (
    <button
      type="button"
      className={styles.row}
      onClick={() => {
        hapticLight();
        navigate('/schedule');
      }}
    >
      <span className={styles.label}>{label}</span>
      <span className={styles.arrow} aria-hidden>›</span>
    </button>
  );
}
