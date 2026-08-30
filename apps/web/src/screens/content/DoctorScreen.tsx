import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { API_URL } from '../../api/client';
import { openConsult } from '../../api/chats';
import { fetchDoctors, fetchSchedule } from '../../api/content';
import { useAuth } from '../../auth/AuthContext';
import { useAppRole } from '../../auth/useAppRole';
import { NestedAppBar } from '../../components/shell/AppBar';
import { DoctorAvatar } from '../../components/DoctorAvatar';
import { Preloader } from '../../components/Preloader';
import { getApiErrorMessage } from '../../utils/apiError';
import styles from './DoctorScreen.module.css';

const DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = DAYS[date.getDay()];
  return `${day}, ${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`;
}

export default function DoctorScreen() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { isStaff } = useAppRole();
  const [writeError, setWriteError] = useState<string | null>(null);
  const autoWriteStarted = useRef(false);

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

  const write = useMutation({
    mutationFn: () => openConsult(doctor?.id),
    onSuccess: (room) => navigate(`/chats/${room.id}`),
    onError: (err: unknown) => setWriteError(getApiErrorMessage(err, 'Не удалось открыть чат')),
  });

  const startChat = () => {
    if (!doctor) return;
    if (!isAuthenticated) {
      navigate(`/auth/login?return=${encodeURIComponent(`/doctors/${doctor.id}?write=1`)}`);
      return;
    }
    setWriteError(null);
    write.mutate();
  };

  useEffect(() => {
    if (autoWriteStarted.current) return;
    if (!isAuthenticated || isStaff || !doctor || searchParams.get('write') !== '1') return;
    autoWriteStarted.current = true;
    setWriteError(null);
    write.mutate();
  }, [isAuthenticated, isStaff, doctor, searchParams, write]);

  if (loadingDoctors) return <Preloader />;
  if (!doctor) {
    return (
      <>
        <NestedAppBar title="Врач" />
        <div className={styles.wrapper}>
          <p className={styles.empty}>Врач не найден</p>
          <button type="button" className={styles.back} onClick={() => navigate(-1)}>
            ‹ Назад
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <NestedAppBar title={doctor.full_name} />
      <div className={styles.wrapper}>
        <DoctorAvatar
          name={doctor.full_name}
          photoUrl={doctor.photo_url ? `${API_URL}${doctor.photo_url}` : undefined}
          size={120}
        />

        <h1 className={styles.name}>{doctor.full_name}</h1>

        {doctor.specialty && (
          <div className={styles.field}>
            <span className={styles.label}>Специализация</span>
            <span className={styles.value}>{doctor.specialty}</span>
          </div>
        )}

        {!isStaff && (
          <>
            {writeError && <p className={styles.writeError}>{writeError}</p>}
            <button
              type="button"
              className={styles.writeBtn}
              onClick={startChat}
              disabled={write.isPending}
            >
              {write.isPending ? 'Открываем…' : 'Написать врачу'}
            </button>
          </>
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
                <span className={styles.scheduleTime}>
                  {entry.time_from.slice(0, 5)} — {entry.time_to.slice(0, 5)}
                </span>
              </div>
            ))}
          </div>
        )}

        <button type="button" className={styles.back} onClick={() => navigate(-1)}>
          ‹ Назад
        </button>
      </div>
    </>
  );
}
