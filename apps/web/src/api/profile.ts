import type { TokenPair } from './auth';
import { authenticatedFetch } from './authenticatedFetch';
import { profileBaseURL } from './client';

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
  const res = await authenticatedFetch(profileBaseURL);
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
  const res = await authenticatedFetch(profileBaseURL, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ display_name: displayName }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Не удалось сохранить профиль');
  }
  return res.json() as Promise<{ profile: MobileProfile; tokens?: TokenPair }>;
}

export async function uploadProfilePhoto(file: File): Promise<MobileProfile> {
  const form = new FormData();
  form.append('photo', file, file.name);

  const res = await authenticatedFetch(`${profileBaseURL}/photo`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Не удалось загрузить фото');
  }
  return res.json() as Promise<MobileProfile>;
}
