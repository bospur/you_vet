import type { TokenPair } from './auth';
import { profileBaseURL } from './client';
import { getAccessToken } from '../auth/tokenStorage';

export interface MobileProfile {
  id: number;
  display_name: string;
  phone: string;
  photo_url: string;
  telegram_user_id?: number;
  vk_user_id?: number;
  linked_at?: string;
  created_at: string;
}

export async function fetchProfile(): Promise<MobileProfile> {
  const token = await getAccessToken();
  const res = await fetch(profileBaseURL, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Не удалось загрузить профиль');
  }
  return res.json() as Promise<MobileProfile>;
}

export async function updateProfile(displayName: string): Promise<{
  profile: MobileProfile;
  tokens?: TokenPair;
}> {
  const token = await getAccessToken();
  const res = await fetch(profileBaseURL, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ display_name: displayName }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Не удалось сохранить профиль');
  }
  return res.json() as Promise<{ profile: MobileProfile; tokens?: TokenPair }>;
}

export async function uploadProfilePhoto(file: File): Promise<MobileProfile> {
  const token = await getAccessToken();
  const form = new FormData();
  form.append('photo', file, file.name);

  const res = await fetch(`${profileBaseURL}/photo`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Не удалось загрузить фото');
  }
  return res.json() as Promise<MobileProfile>;
}
