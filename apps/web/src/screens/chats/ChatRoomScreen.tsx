import { useEffect, useRef, useState, type ChangeEvent, type ComponentType, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaEyeSlash, FaImage } from 'react-icons/fa6';
import { API_URL } from '../../api/client';
import {
  closeConsult,
  fetchChatMessages,
  fetchChatRooms,
  hideChatMessage,
  postChatMessage,
  type ChatRoom,
} from '../../api/chats';
import { useAuth } from '../../auth/AuthContext';
import { isStaffRole, normalizeAppRole } from '../../auth/mobileUser';
import { useAppRole } from '../../auth/useAppRole';
import { NestedAppBar } from '../../components/shell/AppBar';
import { Preloader } from '../../components/Preloader';
import { prepareImageForUpload } from '../../lib/prepareImageForUpload';
import { getApiErrorMessage } from '../../utils/apiError';
import styles from './ChatRoomScreen.module.css';

const HideIcon = FaEyeSlash as ComponentType<{ size?: number }>;
const ImageIcon = FaImage as ComponentType<{ size?: number }>;

export default function ChatRoomScreen() {
  const { roomId } = useParams<{ roomId: string }>();
  const id = Number(roomId);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isStaff, isMedical } = useAppRole();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const roomsQuery = useQuery({
    queryKey: ['chats'],
    queryFn: fetchChatRooms,
    enabled: isAuthenticated,
  });
  const room = (roomsQuery.data ?? []).find((r) => Number(r.id) === id);

  const msgsQuery = useQuery({
    queryKey: ['chat-messages', id],
    queryFn: () => fetchChatMessages(id),
    enabled: isAuthenticated && id > 0,
    refetchInterval: 8_000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgsQuery.data?.length]);

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const send = useMutation({
    mutationFn: async () => {
      const prepared = photo ? await prepareImageForUpload(photo) : undefined;
      return postChatMessage(id, text.trim(), prepared);
    },
    onSuccess: () => {
      setText('');
      clearPhoto();
      void queryClient.invalidateQueries({ queryKey: ['chat-messages', id] });
      void queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
    onError: (err: unknown) => setError(getApiErrorMessage(err, 'Не удалось отправить')),
  });

  const onPickPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
      setError('Можно прикрепить только изображение');
      return;
    }
    setError(null);
    setPhoto(file);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const hide = useMutation({
    mutationFn: (mid: number) => hideChatMessage(id, mid),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['chat-messages', id] }),
    onError: (err: unknown) => setError(getApiErrorMessage(err, 'Не удалось скрыть')),
  });

  const close = useMutation({
    mutationFn: () => closeConsult(id),
    onSuccess: (updated) => {
      queryClient.setQueryData<ChatRoom[]>(['chats'], (old) =>
        (old ?? []).map((r) => (Number(r.id) === Number(updated.id) ? { ...r, ...updated } : r)),
      );
      void queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
    onError: (err: unknown) => setError(getApiErrorMessage(err, 'Не удалось закрыть тред')),
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/auth/login?return=/chats/${id}`, { replace: true });
    }
  }, [isAuthenticated, id, navigate]);

  if (!isAuthenticated) return null;
  if (msgsQuery.isLoading) return <Preloader />;

  const title =
    room?.kind === 'clinic_wall'
      ? 'Общий чат'
      : room?.peer_name || room?.doctor_name || 'Чат с врачом';
  const closed = close.data?.status === 'closed' || room?.status === 'closed';

  return (
    <>
      <NestedAppBar title={title} />
      <div className={styles.wrapper}>
        {error && <p className={styles.formError}>{error}</p>}
        <div className={styles.messages}>
          {(msgsQuery.data ?? []).map((m) => {
            const mine = Number(m.author_id) === Number(user?.id);
            const staffMsg = isStaffRole(normalizeAppRole(m.author_role));
            return (
              <div
                key={m.id}
                className={[
                  styles.bubble,
                  mine ? styles.bubbleMine : '',
                  staffMsg ? styles.bubbleStaff : styles.bubbleClient,
                ].join(' ')}
              >
                <div className={styles.bubbleMeta}>
                  <span className={styles.author}>{m.author_name || 'Участник'}</span>
                  {isStaff && !m.hidden && (
                    <button
                      type="button"
                      className={styles.hideBtn}
                      aria-label="Скрыть сообщение"
                      title="Скрыть"
                      onClick={() => hide.mutate(m.id)}
                    >
                      <HideIcon size={14} />
                    </button>
                  )}
                </div>
                <div className={styles.bubbleBody}>
                  {m.hidden ? (
                    <span className={styles.hiddenMsg}>Сообщение скрыто</span>
                  ) : (
                    <>
                      {m.image_url && (
                        <a
                          href={`${API_URL}${m.image_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.photoLink}
                        >
                          <img
                            src={`${API_URL}${m.image_url}`}
                            alt=""
                            className={styles.bubblePhoto}
                          />
                        </a>
                      )}
                      {m.body}
                    </>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        {isMedical && room?.kind === 'consult' && !closed && (
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => {
              setError(null);
              close.mutate();
            }}
            disabled={close.isPending}
          >
            {close.isPending ? 'Закрываем…' : 'Закрыть тред'}
          </button>
        )}
        {closed ? (
          <p className={styles.empty}>Тред закрыт</p>
        ) : (
          <form
            className={styles.composerWrap}
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (text.trim() || photo) send.mutate();
            }}
          >
            {photoPreview && (
              <div className={styles.previewRow}>
                <img src={photoPreview} alt="" className={styles.previewThumb} />
                <button type="button" className={styles.previewRemove} onClick={clearPhoto}>
                  Убрать фото
                </button>
              </div>
            )}
            <div className={styles.composer}>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={onPickPhoto}
              />
              <button
                type="button"
                className={styles.attachBtn}
                aria-label="Прикрепить фото"
                title="Фото с телефона или компьютера"
                onClick={() => fileRef.current?.click()}
                disabled={send.isPending}
              >
                <ImageIcon size={18} />
              </button>
              <input
                className={styles.input}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={room?.kind === 'clinic_wall' ? 'Сообщение в общий чат' : 'Сообщение или подпись к фото'}
                maxLength={2000}
              />
              <button
                type="submit"
                className={styles.okBtn}
                disabled={(!text.trim() && !photo) || send.isPending}
              >
                {send.isPending ? '…' : '→'}
              </button>
            </div>
          </form>
        )}
        <button type="button" className={styles.back} onClick={() => navigate('/chats')}>
          ‹ К списку
        </button>
      </div>
    </>
  );
}
