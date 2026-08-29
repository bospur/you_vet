import axios from 'axios';
import { authBaseURL } from './client';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AuthApiError {
  error: string;
  message: string;
}

export type AuthChannel = 'telegram' | 'email' | 'whatsapp';

export interface AuthOptions {
  telegram: boolean;
  email: boolean;
  whatsapp: boolean;
}

export async function fetchAuthOptions(): Promise<AuthOptions> {
  const { data } = await axios.get<AuthOptions>(`${authBaseURL}/options`);
  return data;
}

export async function authRequestCode(payload: {
  channel: AuthChannel;
  phone?: string;
  email?: string;
}): Promise<{ expires_in: number }> {
  const { data } = await axios.post<{ expires_in: number }>(`${authBaseURL}/request`, payload);
  return data;
}

export async function authVerifyCode(payload: {
  channel: AuthChannel;
  phone?: string;
  email?: string;
  code: string;
}): Promise<TokenPair> {
  const { data } = await axios.post<TokenPair>(`${authBaseURL}/verify`, payload);
  return data;
}

export function parseAuthError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      if (err.code === 'ERR_NETWORK') {
        return 'Нет связи с сервером. Проверьте интернет или перезапустите приложение';
      }
      return 'Не удалось связаться с сервером';
    }
    const body = err.response.data as AuthApiError;
    if (body.message) return body.message;
    if (body.error === 'PHONE_NOT_LINKED') {
      return 'Сначала привяжите номер в Telegram-боте';
    }
  }
  return 'Не удалось войти. Попробуйте позже';
}
