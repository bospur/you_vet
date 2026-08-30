import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { useAppRole } from '../../auth/useAppRole';
import { fetchStaffGroomingAppointments, patchStaffGroomingAppointment } from '../../api/staff';
import { NestedAppBar } from '../../components/shell/AppBar';
import { Preloader } from '../../components/Preloader';
import { getApiErrorMessage } from '../../utils/apiError';
import styles from '../booking/booking.module.css';

function todayISO() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

const STATUS: Record<string, string> = {
  pending: 'Ожидает',
  confirmed: 'Подтверждено',
  cancelled: 'Отменено',
};

export default function StaffGroomingDayScreen() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isGroomer } = useAppRole();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/staff?return=/staff/grooming', { replace: true });
      return;
    }
    if (!isGroomer) navigate('/', { replace: true });
  }, [isAuthenticated, isGroomer, navigate]);
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['staff-grooming', date],
    queryFn: () => fetchStaffGroomingAppointments(date),
  });

  const patch = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => patchStaffGroomingAppointment(id, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['staff-grooming', date] }),
    onError: (err: unknown) => setError(getApiErrorMessage(err, 'Не удалось обновить')),
  });

  return (
    <>
      <NestedAppBar title="Груминг — день" />
      <div className={styles.wrapper}>
        {error && <p className={styles.formError}>{error}</p>}
        <label className={styles.field}>
          <span className={styles.label}>Дата</span>
          <input className={styles.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        {isLoading ? (
          <Preloader />
        ) : (data ?? []).length === 0 ? (
          <p className={styles.empty}>На эту дату записей нет</p>
        ) : (
          (data ?? []).map((a) => (
            <div key={a.id} className={`${styles.card} ${styles.cardStatic}`}>
              <div className={styles.cardTop}>
                <span className={styles.cardTitle}>
                  {a.start_time.slice(0, 5)}–{a.end_time.slice(0, 5)} · {a.pet_name}
                </span>
                <span className={styles.statusBadge}>{STATUS[a.status] ?? a.status}</span>
              </div>
              <span className={styles.cardMeta}>
                {a.breed} · {a.service_name} · {a.owner_phone}
              </span>
              {a.status === 'pending' && (
                <div className={styles.rowActions}>
                  <button type="button" className={styles.okBtn} onClick={() => patch.mutate({ id: a.id, status: 'confirmed' })}>
                    Подтвердить
                  </button>
                  <button type="button" className={styles.ghostBtn} onClick={() => patch.mutate({ id: a.id, status: 'cancelled' })}>
                    Отменить
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
