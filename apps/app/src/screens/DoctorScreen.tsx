import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@telegram-apps/telegram-ui';
import { fetchDoctors, fetchSchedule } from '../api';
import styles from './DoctorScreen.module.css';

const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.snzbeachvolleyball25.ru';

const DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = DAYS[date.getDay()];
  return `${day}, ${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`;
}

export default function DoctorScreen() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();

  const { data: doctors, isLoading: loadingDoctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: fetchDoctors,
  });

  const { data: scheduleEntries } = useQuery({
    queryKey: ['schedule'],
    queryFn: fetchSchedule,
  });

  const doctor = doctors?.find((d) => String(d.id) === doctorId);
  const doctorSchedule = scheduleEntries?.filter((e) => String(e.doctor_id) === doctorId) ?? [];

  if (loadingDoctors) return <Spinner size="m" />;
  if (!doctor) return null;

  return (
    <div className={styles.wrapper}>
      <button className={styles.back} onClick={() => navigate(-1)}>‹ Назад</button>

      {doctor.photo_url && (
        <img
          src={`${API_URL}${doctor.photo_url}`}
          alt={doctor.full_name}
          className={styles.photo}
        />
      )}

      <h1 className={styles.name}>{doctor.full_name}</h1>

      {doctor.specialty && (
        <div className={styles.field}>
          <span className={styles.label}>Специализация</span>
          <span className={styles.value}>{doctor.specialty}</span>
        </div>
      )}

      {doctor.description && (
        <div className={styles.field}>
          <span className={styles.label}>О враче</span>
          <span className={styles.value}>{doctor.description}</span>
        </div>
      )}

      {doctor.contacts && (
        <div className={styles.field}>
          <span className={styles.label}>Контакты</span>
          <a href={`tel:${doctor.contacts}`} className={styles.phone}>
            📞 {doctor.contacts}
          </a>
        </div>
      )}

      {doctorSchedule.length > 0 && (
        <div className={styles.scheduleSection}>
          <span className={styles.label}>Ближайший приём</span>
          {doctorSchedule.map((entry, i) => (
            <div key={i} className={styles.scheduleRow}>
              <span className={styles.scheduleDate}>{formatDate(entry.date)}</span>
              <span className={styles.scheduleTime}>{entry.time_from} — {entry.time_to}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
