import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cancelBookingRequest, fetchMyBookingRequests } from '../../api';
import { Preloader } from '../../components/Preloader/Preloader';
import { useNotification } from '../../hooks/useNotification';
import { getApiErrorMessage } from '../../utils/apiError';
import {
  formatBookingDate,
  REQUEST_STATUS_CLASS,
  REQUEST_STATUS_LABELS,
  type BookingRequestStatus,
} from '../../domain/booking/labels';
import styles from './booking.module.css';

const CANCELLABLE: BookingRequestStatus[] = ['pending', 'confirmed'];

export default function BookingRequestsScreen() {
  const navigate = useNavigate();
  const notify = useNotification();
  const queryClient = useQueryClient();
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['booking-requests'],
    queryFn: fetchMyBookingRequests,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelBookingRequest,
    onSuccess: () => {
      setConfirmCancelId(null);
      void queryClient.invalidateQueries({ queryKey: ['booking-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['booking-availability'] });
      notify('Заявка отменена', 'success');
    },
    onError: (err: unknown) => {
      notify(getApiErrorMessage(err, 'Не удалось отменить заявку'), 'error');
    },
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
          const canCancel = CANCELLABLE.includes(status);
          const isConfirming = confirmCancelId === req.id;

          return (
            <div key={req.id} className={`${styles.card} ${styles.cardStatic}`}>
              <div className={styles.cardTop}>
                <span className={styles.cardTitle}>{req.service_name}</span>
                <span className={`${styles.statusBadge} ${styles[REQUEST_STATUS_CLASS[status]]}`}>
                  {REQUEST_STATUS_LABELS[status]}
                </span>
              </div>
              <span className={styles.cardMeta}>
                {formatBookingDate(req.requested_date)}
                {req.slot_time ? ` · ${req.slot_time.slice(0, 5)}` : ''}
                {' · '}
                {req.pet_name}
              </span>
              {req.reject_reason && (
                <p className={styles.rejectReason}>{req.reject_reason}</p>
              )}
              {canCancel && !isConfirming && (
                <button
                  type="button"
                  className={styles.cancelRequestBtn}
                  disabled={cancelMutation.isPending}
                  onClick={() => setConfirmCancelId(req.id)}
                >
                  Отменить заявку
                </button>
              )}
              {canCancel && isConfirming && (
                <div className={styles.cancelConfirmRow}>
                  <button
                    type="button"
                    className={styles.cancelNo}
                    onClick={() => setConfirmCancelId(null)}
                  >
                    Нет
                  </button>
                  <button
                    type="button"
                    className={styles.cancelYes}
                    disabled={cancelMutation.isPending}
                    onClick={() => cancelMutation.mutate(req.id)}
                  >
                    {cancelMutation.isPending ? '…' : 'Да, отменить'}
                  </button>
                </div>
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
