import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchMyGroomingAppointments } from '../../api/groomingBook';
import { NestedAppBar } from '../../components/shell/AppBar';
import { Preloader } from '../../components/Preloader';
import { formatBookingDate } from '../../domain/booking/labels';
import styles from '../booking/booking.module.css';

const STATUS: Record<string, string> = {
  pending: 'Ожидает подтверждения',
  confirmed: 'Подтверждено',
  cancelled: 'Отменено',
};

export default function GroomingMyScreen() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['grooming-mine'],
    queryFn: fetchMyGroomingAppointments,
  });

  if (isLoading) return <Preloader />;

  return (
    <>
      <NestedAppBar title="Мои записи на груминг" />
      <div className={styles.wrapper}>
        {(data ?? []).length === 0 ? (
          <p className={styles.empty}>Пока нет записей</p>
        ) : (
          (data ?? []).map((a) => (
            <div key={a.id} className={`${styles.card} ${styles.cardStatic}`}>
              <div className={styles.cardTop}>
                <span className={styles.cardTitle}>{a.service_name}</span>
                <span className={styles.statusBadge}>{STATUS[a.status] ?? a.status}</span>
              </div>
              <span className={styles.cardMeta}>
                {formatBookingDate(a.date)} · {a.start_time.slice(0, 5)} · {a.pet_name}
              </span>
              <span className={styles.cardMeta}>{a.breed}</span>
            </div>
          ))
        )}
        <button type="button" className={styles.card} onClick={() => navigate('/grooming/book')}>
          <span className={styles.cardTitle}>Новая запись</span>
        </button>
        <button type="button" className={styles.back} onClick={() => navigate('/grooming')}>
          ‹ Назад
        </button>
      </div>
    </>
  );
}
