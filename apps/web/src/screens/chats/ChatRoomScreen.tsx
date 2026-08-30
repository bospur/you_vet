import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  closeConsult,
  fetchChatMessages,
  fetchChatRooms,
  hideChatMessage,
  postChatMessage,
} from '../../api/chats';
import { useAuth } from '../../auth/AuthContext';
import { useAppRole } from '../../auth/useAppRole';
import { NestedAppBar } from '../../components/shell/AppBar';
import { Preloader } from '../../components/Preloader';
import { getApiErrorMessage } from '../../utils/apiError';
import styles from '../booking/booking.module.css';

export default function ChatRoomScreen() {
  const { roomId } = useParams<{ roomId: string }>();
  const id = Number(roomId);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isStaff, isMedical } = useAppRole();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const roomsQuery = useQuery({
    queryKey: ['chats'],
    queryFn: fetchChatRooms,
    enabled: isAuthenticated,
  });
  const room = (roomsQuery.data ?? []).find((r) => r.id === id);

  const msgsQuery = useQuery({
    queryKey: ['chat-messages', id],
    queryFn: () => fetchChatMessages(id),
    enabled: isAuthenticated && id > 0,
    refetchInterval: 8_000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgsQuery.data?.length]);

  const send = useMutation({
    mutationFn: () => postChatMessage(id, text.trim()),
    onSuccess: () => {
      setText('');
      void queryClient.invalidateQueries({ queryKey: ['chat-messages', id] });
      void queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
    onError: (err: unknown) => setError(getApiErrorMessage(err, 'Не удалось отправить')),
  });

  const hide = useMutation({
    mutationFn: (mid: number) => hideChatMessage(id, mid),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['chat-messages', id] }),
  });

  const close = useMutation({
    mutationFn: () => closeConsult(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['chats'] }),
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/auth/login?return=/chats/${id}`, { replace: true });
    }
  }, [isAuthenticated, id, navigate]);

  if (!isAuthenticated) return null;
  if (msgsQuery.isLoading) return <Preloader />;

  const title = room?.kind === 'clinic_wall' ? 'Общий чат' : room?.peer_name || 'Чат с врачом';
  const closed = room?.status === 'closed';

  return (
    <>
      <NestedAppBar title={title} />
      <div className={styles.wrapper}>
        {error && <p className={styles.formError}>{error}</p>}
        <div className={styles.messages}>
          {(msgsQuery.data ?? []).map((m) => {
            const mine = m.author_id === user?.id;
            return (
              <div key={m.id} className={`${styles.bubble} ${mine ? styles.bubbleMine : ''}`}>
                <div className={styles.bubbleMeta}>
                  {m.author_name || 'Участник'}
                  {isStaff && !m.hidden && (
                    <button type="button" className={styles.back} style={{ padding: 0, marginLeft: 8 }} onClick={() => hide.mutate(m.id)}>
                      скрыть
                    </button>
                  )}
                </div>
                {m.hidden ? <span className={styles.hiddenMsg}>Сообщение скрыто</span> : m.body}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        {isMedical && room?.kind === 'consult' && !closed && (
          <button type="button" className={styles.ghostBtn} onClick={() => close.mutate()}>
            Закрыть тред
          </button>
        )}
        {closed ? (
          <p className={styles.empty}>Тред закрыт</p>
        ) : (
          <form
            className={styles.composer}
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (text.trim()) send.mutate();
            }}
          >
            <input
              className={styles.input}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={room?.kind === 'clinic_wall' ? 'Сообщение в общий чат' : 'Сообщение врачу'}
              maxLength={2000}
            />
            <button type="submit" className={styles.okBtn} disabled={!text.trim() || send.isPending}>
              →
            </button>
          </form>
        )}
        <button type="button" className={styles.back} onClick={() => navigate('/chats')}>
          ‹ К списку
        </button>
      </div>
    </>
  );
}
