import * as VKID from '@vkid/sdk';
import { authVk } from '../api/auth';
import { sessionGet, sessionRemove, sessionSet } from '../lib/webStorage';
import { generateCodeVerifier, generateState } from './pkce';
import { setTokens } from './tokenStorage';

const VK_VERIFIER_KEY = 'vk_code_verifier';
const VK_RETURN_KEY = 'vk_return_url';

function getVkAppId(): number {
  const appId = Number(import.meta.env.VITE_VK_APP_ID);
  if (!appId || Number.isNaN(appId)) {
    throw new Error('VITE_VK_APP_ID не задан в .env.local');
  }
  return appId;
}

/** Redirect URI в кабинете VK: https://web.bospur.ru/auth/vk-callback */
export function getVkRedirectUri(): string {
  const fromEnv = import.meta.env.VITE_VK_REDIRECT_URI as string | undefined;
  if (fromEnv) {
    return fromEnv;
  }
  return `${window.location.origin}/auth/vk-callback`;
}

export function isVkConfigured(): boolean {
  const id = import.meta.env.VITE_VK_APP_ID;
  return Boolean(id && String(id).trim() !== '');
}

export async function startVkLogin(returnUrl = '/'): Promise<void> {
  const appId = getVkAppId();
  const redirectUrl = getVkRedirectUri();
  const codeVerifier = generateCodeVerifier();
  const state = generateState();

  sessionSet(VK_VERIFIER_KEY, codeVerifier);
  sessionSet(VK_RETURN_KEY, returnUrl);

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

  const codeVerifier = sessionGet(VK_VERIFIER_KEY);
  if (!codeVerifier) {
    throw new Error('Сессия VK истекла — попробуйте войти снова');
  }

  const returnUrl = sessionGet(VK_RETURN_KEY) ?? '/';
  const redirectUri = getVkRedirectUri();

  const tokens = await authVk({
    code,
    code_verifier: codeVerifier,
    device_id: deviceId,
    redirect_uri: redirectUri,
  });

  sessionRemove(VK_VERIFIER_KEY);
  sessionRemove(VK_RETURN_KEY);

  await setTokens(tokens.access_token, tokens.refresh_token);
  return returnUrl;
}
