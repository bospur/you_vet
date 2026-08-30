import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cancelBookingRequest, fetchMyBookingRequests, type BookingRequest } from '../../api/booking';
import { NestedAppBar } from '../../components/shell/AppBar';
import { Preloader } from '../../components/Preloader';
import { partitionBookingRequests } from '../../domain/booking/requests';
import {
  formatBookingDate,
  REQUEST_STATUS_CLASS,
  REQUEST_STATUS_LABELS,
  type BookingRequestStatus,
} from '../../domain/booking/labels';
import { getApiErrorMessage } from '../../utils/apiError';
import styles from './booking.module.css';

const CANCELLABLE: BookingRequestStatus[] = ['pending', 'confirmed'];

export default function BookingRequestsScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'active' | 'archive'>('active');
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['booking-requests'],
    queryFn: fetchMyBookingRequests,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelBookingRequest,
    onSuccess: () => {
      setConfirmId(null);
      void queryClient.invalidateQueries({ queryKey: ['booking-requests'] });
    },
    onError: (err: unknown) => setError(getApiErrorMessage(err, 'Не удалось отменить')),
  });

  const { active, archive } = useMemo(() => partitionBookingRequests(data ?? []), [data]);
  const visible = tab === 'active' ? active : archive;

  if (isLoading) return <Preloader />;

  return (
    <>
      <NestedAppBar title="Мои заявки" />
      <div className={styles.wrapper}>
        {error && <p className={styles.formError}>{error}</p>}
        <div className={styles.tabs}>
          <button type="button" className={`${styles.tab} ${tab === 'active' ? styles.tabActive : ''}`} onClick={() => setTab('active')}>
            Активные
          </button>
          <button type="button" className={`${styles.tab} ${tab === 'archive' ? styles.tabActive : ''}`} onClick={() => setTab('archive')}>
            Архив
          </button>
        </div>
        {visible.length === 0 ? (
          <p className={styles.empty}>{tab === 'active' ? 'Нет активных заявок' : 'В архиве пусто'}</p>
        ) : (
          visible.map((req: BookingRequest) => {
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
                  {formatBookingDate(req.requested_date)}
                  {req.slot_time ? ` · ${req.slot_time.slice(0, 5)}` : ''} · {req.pet_name}
                </span>
                {req.reject_reason && <p className={styles.rejectReason}>{req.reject_reason}</p>}
                {CANCELLABLE.includes(status) && confirmId !== req.id && (
                  <button type="button" className={styles.cancelRequestBtn} onClick={() => setConfirmId(req.id)}>
                    Отменить
                  </button>
                )}
                {confirmId === req.id && (
                  <div className={styles.cancelConfirmRow}>
                    <button type="button" className={styles.ghostBtn} onClick={() => setConfirmId(null)}>Нет</button>
                    <button type="button" className={styles.cancelRequestBtn} onClick={() => cancelMutation.mutate(req.id)}>
                      Да, отменить
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
        <button type="button" className={styles.card} onClick={() => navigate('/booking/new')}>
          <span className={styles.cardTitle}>Новая запись</span>
        </button>
        <button type="button" className={styles.back} onClick={() => navigate('/booking')}>
          ‹ Назад
        </button>
      </div>
    </>
  );
}
