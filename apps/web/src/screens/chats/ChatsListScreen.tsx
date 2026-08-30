import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchChatRooms, openConsult } from '../../api/chats';
import { useAuth } from '../../auth/AuthContext';
import { useAppRole } from '../../auth/useAppRole';
import { NestedAppBar } from '../../components/shell/AppBar';
import { Preloader } from '../../components/Preloader';
import { getApiErrorMessage } from '../../utils/apiError';
import styles from '../booking/booking.module.css';

export default function ChatsListScreen() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isStaff, isMedical } = useAppRole();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login?return=/chats', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['chats'],
    queryFn: fetchChatRooms,
    enabled: isAuthenticated,
    refetchInterval: 10_000,
  });

  const consult = useMutation({
    mutationFn: () => openConsult(),
    onSuccess: (room) => navigate(`/chats/${room.id}`),
  });

  if (!isAuthenticated) return null;
  if (isLoading) return <Preloader />;

  const wall = (data ?? []).find((r) => r.kind === 'clinic_wall');
  const consults = (data ?? []).filter((r) => r.kind === 'consult');

  return (
    <>
      <NestedAppBar title="Чаты" />
      <div className={styles.wrapper}>
        {error && <p className={styles.formError}>{getApiErrorMessage(error, 'Не удалось загрузить чаты')}</p>}
        {consult.error && (
          <p className={styles.formError}>{getApiErrorMessage(consult.error, 'Не удалось открыть чат')}</p>
        )}
        {wall && (
          <button type="button" className={styles.card} onClick={() => navigate(`/chats/${wall.id}`)}>
            <span className={styles.cardTitle}>Общий чат клиники</span>
            <span className={styles.cardMeta}>{wall.last_preview || 'Напишите сообщение'}</span>
            {wall.unread > 0 && <span className={styles.cardHint}>{wall.unread} новых</span>}
          </button>
        )}
        {!isStaff && (
          <button type="button" className={styles.submit} onClick={() => consult.mutate()} disabled={consult.isPending}>
            {consult.isPending ? '…' : 'Написать врачу'}
          </button>
        )}
        {consults.length > 0 && <p className={styles.sectionTitle}>{isMedical ? 'Треды клиентов' : 'Переписка с врачом'}</p>}
        {consults.map((room) => (
          <button key={room.id} type="button" className={styles.card} onClick={() => navigate(`/chats/${room.id}`)}>
            <span className={styles.cardTitle}>
              {room.peer_name || room.doctor_name || (isMedical ? 'Клиент' : 'Врач')}
            </span>
            {isMedical && room.doctor_name && (
              <span className={styles.cardMeta}>Тред с врачом: {room.doctor_name}</span>
            )}
            <span className={styles.cardMeta}>{room.last_preview || 'Нет сообщений'}</span>
            {room.status === 'closed' && <span className={styles.cardHint}>Закрыт</span>}
            {room.unread > 0 && <span className={styles.cardHint}>{room.unread} новых</span>}
          </button>
        ))}
        <button type="button" className={styles.back} onClick={() => void refetch()}>
          Обновить
        </button>
      </div>
    </>
  );
}
