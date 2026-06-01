import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchMyBookingRequests } from '../../api';
import { Preloader } from '../../components/Preloader/Preloader';
import { useNotification } from '../../hooks/useNotification';
import {
  formatBookingDate,
  REQUEST_STATUS_CLASS,
  REQUEST_STATUS_LABELS,
  type BookingRequestStatus,
} from '../../domain/booking/labels';
import styles from './booking.module.css';

export default function BookingRequestsScreen() {
  const navigate = useNavigate();
  const notify = useNotification();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['booking-requests'],
    queryFn: fetchMyBookingRequests,
  });

  useEffect(() => {
    if (isError) notify('Не удалось загрузить заявки.', 'error');
  }, [isError, notify]);

  if (isLoading) return <Preloader />;

  const requests = data ?? [];

  return (
    <div className={styles.wrapper}>
      <p className={styles.header}>Мои заявки</p>
      {requests.length === 0 ? (
        <>
          <p className={styles.empty}>У вас пока нет заявок</p>
          <button type="button" className={styles.card} onClick={() => navigate('/booking/new')}>
            <span className={styles.cardTitle}>Записаться</span>
            <span className={styles.cardMeta}>Выбрать услугу и дату</span>
          </button>
        </>
      ) : (
        requests.map((req) => {
          const status = req.status as BookingRequestStatus;
          return (
            <div key={req.id} className={`${styles.card} ${styles.cardStatic}`}>
              <div className={styles.cardTop}>
                <span className={styles.cardTitle}>{req.service_name}</span>
                <span className={`${styles.statusBadge} ${styles[REQUEST_STATUS_CLASS[status]]}`}>
                  {REQUEST_STATUS_LABELS[status]}
                </span>
              </div>
              <span className={styles.cardMeta}>
                {formatBookingDate(req.requested_date)} · {req.pet_name}
              </span>
              {req.reject_reason && (
                <p className={styles.rejectReason}>{req.reject_reason}</p>
              )}
            </div>
          );
        })
      )}
      <button type="button" className={styles.back} onClick={() => navigate('/booking')}>
        ‹ Назад
      </button>
    </div>
  );
}
