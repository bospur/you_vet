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

export async function authVk(payload: {
  code: string;
  code_verifier: string;
  device_id: string;
  redirect_uri: string;
}): Promise<TokenPair> {
  const { data } = await axios.post<TokenPair>(`${authBaseURL}/vk`, payload);
  return data;
}

export async function authRequestCode(phone: string): Promise<{ expires_in: number }> {
  const { data } = await axios.post<{ expires_in: number }>(`${authBaseURL}/request`, { phone });
  return data;
}

export async function authVerifyCode(phone: string, code: string): Promise<TokenPair> {
  const { data } = await axios.post<TokenPair>(`${authBaseURL}/verify`, { phone, code });
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
    if (body.error === 'VK_NOT_CONFIGURED') {
      return 'Вход через VK пока не настроен на сервере';
    }
  }
  return 'Не удалось войти. Попробуйте позже';
}
