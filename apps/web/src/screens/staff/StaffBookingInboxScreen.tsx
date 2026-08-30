import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { useAppRole } from '../../auth/useAppRole';
import { fetchStaffBookingRequests, patchStaffBookingRequest } from '../../api/staff';
import { NestedAppBar } from '../../components/shell/AppBar';
import { Preloader } from '../../components/Preloader';
import { formatBookingDate, REQUEST_STATUS_CLASS, REQUEST_STATUS_LABELS, type BookingRequestStatus } from '../../domain/booking/labels';
import { getApiErrorMessage } from '../../utils/apiError';
import styles from '../booking/booking.module.css';

export default function StaffBookingInboxScreen() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isMedical } = useAppRole();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login?return=/staff/booking', { replace: true });
      return;
    }
    if (!isMedical) navigate('/', { replace: true });
  }, [isAuthenticated, isMedical, navigate]);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['staff-booking', tab],
    queryFn: () => fetchStaffBookingRequests(tab === 'pending' ? 'pending' : undefined),
  });

  const patch = useMutation({
    mutationFn: ({ id, status, reject_reason }: { id: number; status: string; reject_reason?: string }) =>
      patchStaffBookingRequest(id, { status, reject_reason }),
    onSuccess: () => {
      setRejectId(null);
      setReason('');
      void queryClient.invalidateQueries({ queryKey: ['staff-booking'] });
    },
    onError: (err: unknown) => setError(getApiErrorMessage(err, 'Не удалось обновить заявку')),
  });

  if (isLoading) return <Preloader />;

  return (
    <>
      <NestedAppBar title="Заявки на приём" />
      <div className={styles.wrapper}>
        {error && <p className={styles.formError}>{error}</p>}
        <div className={styles.tabs}>
          <button type="button" className={`${styles.tab} ${tab === 'pending' ? styles.tabActive : ''}`} onClick={() => setTab('pending')}>
            Новые
          </button>
          <button type="button" className={`${styles.tab} ${tab === 'all' ? styles.tabActive : ''}`} onClick={() => setTab('all')}>
            Все
          </button>
        </div>
        {(data ?? []).length === 0 ? (
          <p className={styles.empty}>Заявок нет</p>
        ) : (
          (data ?? []).map((req) => {
            const status = req.status as BookingRequestStatus;
            return (
              <div key={req.id} className={`${styles.card} ${styles.cardStatic}`}>
                <div className={styles.cardTop}>
                  <span className={styles.cardTitle}>{req.service_name}</span>
                  <span className={`${styles.statusBadge} ${styles[REQUEST_STATUS_CLASS[status] ?? '']}`}>
                    {REQUEST_STATUS_LABELS[status] ?? req.status}
                  </span>
                </div>
                <span className={styles.cardMeta}>
                  {formatBookingDate(req.requested_date)}
                  {req.slot_time ? ` · ${req.slot_time.slice(0, 5)}` : ''}
                </span>
                <span className={styles.cardMeta}>
                  {req.client_name} · {req.client_phone} · {req.pet_name}
                </span>
                {req.status === 'pending' && (
                  <div className={styles.rowActions}>
                    <button type="button" className={styles.okBtn} onClick={() => patch.mutate({ id: req.id, status: 'confirmed' })}>
                      Подтвердить
                    </button>
                    <button type="button" className={styles.ghostBtn} onClick={() => setRejectId(req.id)}>
                      Отклонить
                    </button>
                  </div>
                )}
                {rejectId === req.id && (
                  <form
                    className={styles.form}
                    onSubmit={(e) => {
                      e.preventDefault();
                      patch.mutate({ id: req.id, status: 'rejected', reject_reason: reason.trim() || undefined });
                    }}
                  >
                    <input className={styles.input} placeholder="Причина (необязательно)" value={reason} onChange={(e) => setReason(e.target.value)} />
                    <button type="submit" className={styles.submit}>Отклонить заявку</button>
                  </form>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
