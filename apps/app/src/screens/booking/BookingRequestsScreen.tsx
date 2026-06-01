import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cancelBookingRequest, fetchMyBookingRequests, type BookingRequest } from '../../api';
import { Preloader } from '../../components/Preloader/Preloader';
import { useNotification } from '../../hooks/useNotification';
import { getApiErrorMessage } from '../../utils/apiError';
import { partitionBookingRequests } from '../../domain/booking/requests';
import {
  formatBookingDate,
  REQUEST_STATUS_CLASS,
  REQUEST_STATUS_LABELS,
  type BookingRequestStatus,
} from '../../domain/booking/labels';
import styles from './booking.module.css';

const CANCELLABLE: BookingRequestStatus[] = ['pending', 'confirmed'];

type RequestsTab = 'active' | 'archive';

function RequestCard({
  req,
  confirmCancelId,
  setConfirmCancelId,
  cancelMutation,
}: {
  req: BookingRequest;
  confirmCancelId: number | null;
  setConfirmCancelId: (id: number | null) => void;
  cancelMutation: ReturnType<typeof useMutation<BookingRequest, unknown, number>>;
}) {
  const status = req.status as BookingRequestStatus;
  const canCancel = CANCELLABLE.includes(status);
  const isConfirming = confirmCancelId === req.id;

  return (
    <div className={`${styles.card} ${styles.cardStatic}`}>
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
      {req.reject_reason && <p className={styles.rejectReason}>{req.reject_reason}</p>}
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
          <button type="button" className={styles.cancelNo} onClick={() => setConfirmCancelId(null)}>
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
}

export default function BookingRequestsScreen() {
  const navigate = useNavigate();
  const notify = useNotification();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<RequestsTab>('active');
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

  const { active, archive } = useMemo(
    () => partitionBookingRequests(data ?? []),
    [data],
  );

  const visible = tab === 'active' ? active : archive;

  useEffect(() => {
    if (isError) notify('Не удалось загрузить заявки.', 'error');
  }, [isError, notify]);

  if (isLoading) return <Preloader />;

  const hasAny = active.length > 0 || archive.length > 0;

  return (
    <div className={styles.wrapper}>
      <p className={styles.header}>Мои заявки</p>

      {hasAny && (
        <div className={styles.tabs} role="tablist" aria-label="Заявки">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'active'}
            className={`${styles.tab} ${tab === 'active' ? styles.tabActive : ''}`}
            onClick={() => setTab('active')}
          >
            Активные{active.length > 0 ? ` (${active.length})` : ''}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'archive'}
            className={`${styles.tab} ${tab === 'archive' ? styles.tabActive : ''}`}
            onClick={() => setTab('archive')}
          >
            Архив{archive.length > 0 ? ` (${archive.length})` : ''}
          </button>
        </div>
      )}

      {!hasAny ? (
        <>
          <p className={styles.empty}>У вас пока нет заявок</p>
          <button type="button" className={styles.card} onClick={() => navigate('/booking/new')}>
            <span className={styles.cardTitle}>Записаться</span>
            <span className={styles.cardMeta}>Выбрать услугу и дату</span>
          </button>
        </>
      ) : visible.length === 0 ? (
        <p className={styles.empty}>
          {tab === 'active' ? 'Нет активных заявок' : 'В архиве пока пусто'}
        </p>
      ) : (
        visible.map((req) => (
          <RequestCard
            key={req.id}
            req={req}
            confirmCancelId={confirmCancelId}
            setConfirmCancelId={setConfirmCancelId}
            cancelMutation={cancelMutation}
          />
        ))
      )}

      {hasAny && (
        <button type="button" className={styles.card} onClick={() => navigate('/booking/new')}>
          <span className={styles.cardTitle}>Новая запись</span>
          <span className={styles.cardMeta}>Выбрать услугу и дату</span>
        </button>
      )}

      <button type="button" className={styles.back} onClick={() => navigate('/booking')}>
        ‹ Назад
      </button>
    </div>
  );
}
