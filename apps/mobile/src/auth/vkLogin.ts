import { Capacitor } from '@capacitor/core';
import * as VKID from '@vkid/sdk';
import { authVk } from '../api/auth';
import { generateCodeVerifier } from './pkce';
import { setTokens } from './tokenStorage';

const VK_VERIFIER_KEY = 'vk_code_verifier';
const VK_RETURN_KEY = 'vk_return_url';

/** HTTPS-мост: VK → эта страница → deep link в APK (кабинет VK принимает только https). */
const VK_HTTPS_BRIDGE = 'https://app.snzbeachvolleyball25.ru/vk-callback.html';

/** Redirect URI для VK ID: страница приложения, куда VK вернёт code. */
export function getVkRedirectUri(): string {
  const fromEnv = import.meta.env.VITE_VK_REDIRECT_URI as string | undefined;
  if (fromEnv) {
    return fromEnv;
  }
  if (Capacitor.isNativePlatform()) {
    return VK_HTTPS_BRIDGE;
  }
  return `${window.location.origin}/auth/vk-callback`;
}

/** Парсит deep link / https URL возврата VK → query string для /auth/vk-callback. */
export function vkCallbackSearchFromUrl(url: string): string | null {
  if (!url.includes('auth/vk-callback')) {
    return null;
  }
  try {
    const parsed = new URL(url);
    return parsed.search || '';
  } catch {
    const q = url.indexOf('?');
    return q >= 0 ? url.slice(q) : '';
  }
}

export function isVkConfigured(): boolean {
  const id = import.meta.env.VITE_VK_APP_ID;
  return Boolean(id && String(id).trim() !== '');
}

/** Запускает полный redirect на VK (работает в мобильном браузере и WebView). */
export function startVkLogin(returnUrl = '/'): void {
  const appId = Number(import.meta.env.VITE_VK_APP_ID);
  if (!appId || Number.isNaN(appId)) {
    throw new Error('VITE_VK_APP_ID не задан в .env.local');
  }

  const redirectUrl = getVkRedirectUri();
  const codeVerifier = generateCodeVerifier();

  sessionStorage.setItem(VK_VERIFIER_KEY, codeVerifier);
  sessionStorage.setItem(VK_RETURN_KEY, returnUrl);

  VKID.Config.init({
    app: appId,
    redirectUrl,
    mode: VKID.ConfigAuthMode.Redirect,
    responseMode: VKID.ConfigResponseMode.Redirect,
    scope: 'phone email',
    codeVerifier,
  });

  void VKID.Auth.login();
}

/** Завершает вход после возврата с VK на /auth/vk-callback. */
export async function completeVkLogin(searchParams: URLSearchParams): Promise<string> {
  const error = searchParams.get('error');
  if (error) {
    throw new Error(searchParams.get('error_description') ?? 'Вход через VK отменён');
  }

  const code = searchParams.get('code');
  const deviceId = searchParams.get('device_id');
  if (!code || !deviceId) {
    throw new Error('VK не вернул код авторизации');
  }

  const codeVerifier = sessionStorage.getItem(VK_VERIFIER_KEY);
  if (!codeVerifier) {
    throw new Error('Сессия VK истекла — попробуйте войти снова');
  }

  const returnUrl = sessionStorage.getItem(VK_RETURN_KEY) ?? '/';
  const redirectUri = getVkRedirectUri();

  const tokens = await authVk({
    code,
    code_verifier: codeVerifier,
    device_id: deviceId,
    redirect_uri: redirectUri,
  });

  sessionStorage.removeItem(VK_VERIFIER_KEY);
  sessionStorage.removeItem(VK_RETURN_KEY);

  await setTokens(tokens.access_token, tokens.refresh_token);
  return returnUrl;
}
