import { authenticatedFetch } from './authenticatedFetch';
import { chatsBaseURL } from './client';

export interface ChatRoom {
  id: number;
  kind: 'clinic_wall' | 'consult';
  status: string;
  created_at: string;
  last_preview?: string;
  last_at?: string;
  unread: number;
  peer_name?: string;
  doctor_id?: number;
  doctor_name?: string;
}

export interface ChatMessage {
  id: number;
  room_id: number;
  author_id?: number;
  author_name?: string;
  author_role?: string;
  body: string;
  image_url?: string;
  hidden: boolean;
  created_at: string;
}

async function readJSON<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const fetchChatRooms = () =>
  authenticatedFetch(chatsBaseURL).then((r) => readJSON<ChatRoom[]>(r));

export const openConsult = (doctorId?: number) =>
  authenticatedFetch(`${chatsBaseURL}/consult`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doctorId ? { doctor_id: doctorId } : {}),
  }).then((r) => readJSON<ChatRoom>(r));

export const fetchChatMessages = (id: number, afterId?: number) => {
  const q = afterId ? `?after_id=${afterId}` : '';
  return authenticatedFetch(`${chatsBaseURL}/${id}/messages${q}`).then((r) =>
    readJSON<ChatMessage[]>(r),
  );
};

export const postChatMessage = (id: number, body: string, photo?: File) => {
  if (photo) {
    const form = new FormData();
    if (body.trim()) form.append('body', body.trim());
    form.append('photo', photo);
    return authenticatedFetch(`${chatsBaseURL}/${id}/messages`, {
      method: 'POST',
      body: form,
    }).then((r) => readJSON<ChatMessage>(r));
  }
  return authenticatedFetch(`${chatsBaseURL}/${id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  }).then((r) => readJSON<ChatMessage>(r));
};

export const postWallMessage = (body: string) =>
  authenticatedFetch(`${chatsBaseURL}/wall/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  }).then((r) => readJSON<ChatMessage>(r));

export const hideChatMessage = (roomId: number, messageId: number) =>
  authenticatedFetch(`${chatsBaseURL}/${roomId}/messages/${messageId}/hide`, {
    method: 'POST',
  }).then((r) => {
    if (!r.ok) throw new Error('Не удалось скрыть');
  });

export const closeConsult = (id: number) =>
  authenticatedFetch(`${chatsBaseURL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'closed' }),
  }).then((r) => readJSON<ChatRoom>(r));
