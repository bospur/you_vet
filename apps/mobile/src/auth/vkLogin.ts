import { Capacitor } from '@capacitor/core';
import * as VKID from '@vkid/sdk';
import { authVk } from '../api/auth';
import { generateCodeChallenge, generateCodeVerifier, generateState } from './pkce';
import { setTokens } from './tokenStorage';

const VK_VERIFIER_KEY = 'vk_code_verifier';
const VK_RETURN_KEY = 'vk_return_url';

/** HTTPS redirect для Web-приложения VK (Capacitor = Web SDK, не native Android SDK). */
const VK_HTTPS_BRIDGE = 'https://app.bospur.ru/vk-callback.html';

function getVkAppId(): number {
  const appId = Number(import.meta.env.VITE_VK_APP_ID);
  if (!appId || Number.isNaN(appId)) {
    throw new Error('VITE_VK_APP_ID не задан в .env.local');
  }
  return appId;
}

/**
 * Redirect URI в кабинете VK (тип приложения: Web).
 * APK: https-мост → deep link обратно в приложение (см. apps/app/public/vk-callback.html).
 */
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

/** Парсит URL возврата VK → query string для /auth/vk-callback. */
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

async function buildVkAuthorizeUrl(
  appId: number,
  redirectUri: string,
  codeVerifier: string,
  state: string,
): Promise<string> {
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: String(appId),
    scope: 'phone email',
    redirect_uri: redirectUri,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'login',
  });
  // origin = базовый домен из кабинета VK (Web-приложение)
  if (Capacitor.isNativePlatform()) {
    params.set('origin', 'https://app.bospur.ru');
  } else {
    params.set('origin', window.location.origin);
  }
  return `https://id.vk.ru/authorize?${params.toString()}`;
}

/** Запускает OAuth VK. На Android — Chrome Custom Tab, не WebView. */
export async function startVkLogin(returnUrl = '/'): Promise<void> {
  const appId = getVkAppId();
  const redirectUrl = getVkRedirectUri();
  const codeVerifier = generateCodeVerifier();
  const state = generateState();

  sessionStorage.setItem(VK_VERIFIER_KEY, codeVerifier);
  sessionStorage.setItem(VK_RETURN_KEY, returnUrl);

  if (Capacitor.isNativePlatform()) {
    const { Browser } = await import('@capacitor/browser');
    const url = await buildVkAuthorizeUrl(appId, redirectUrl, codeVerifier, state);
    await Browser.open({ url });
    return;
  }

  VKID.Config.init({
    app: appId,
    redirectUrl,
    mode: VKID.ConfigAuthMode.Redirect,
    responseMode: VKID.ConfigResponseMode.Redirect,
    scope: 'phone email',
    codeVerifier,
    state,
  });

  void VKID.Auth.login();
}

/** Закрывает вкладку браузера после возврата в приложение (Android). */
export async function closeVkBrowserIfOpen(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.close();
  } catch {
    // вкладка уже закрыта
  }
}

/** Завершает вход после возврата с VK. */
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
  await closeVkBrowserIfOpen();
  return returnUrl;
}
