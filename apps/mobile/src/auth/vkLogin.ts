import * as VKID from '@vkid/sdk';
import { authVk } from '../api/auth';
import { generateCodeVerifier } from './pkce';
import { setTokens } from './tokenStorage';

export function isVkConfigured(): boolean {
  const id = import.meta.env.VITE_VK_APP_ID;
  return Boolean(id && String(id).trim() !== '');
}

export async function loginWithVk(): Promise<void> {
  const appId = Number(import.meta.env.VITE_VK_APP_ID);
  if (!appId || Number.isNaN(appId)) {
    throw new Error('VITE_VK_APP_ID не задан в .env.local');
  }

  const redirectUrl =
    import.meta.env.VITE_VK_REDIRECT_URI ?? 'https://oauth.vk.com/blank.html';
  const codeVerifier = generateCodeVerifier();

  VKID.Config.init({
    app: appId,
    redirectUrl,
    responseMode: VKID.ConfigResponseMode.Callback,
    scope: 'phone email',
    codeVerifier,
  });

  const payload = (await VKID.Auth.login()) as VKID.AuthResponse;
  const tokens = await authVk({
    code: payload.code,
    code_verifier: codeVerifier,
    device_id: payload.device_id,
    redirect_uri: redirectUrl,
  });

  await setTokens(tokens.access_token, tokens.refresh_token);
}
