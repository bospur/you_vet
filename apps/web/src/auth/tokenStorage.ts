import { localGet, localRemove, localSet } from '../lib/webStorage';

const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

export async function getAccessToken(): Promise<string | null> {
  return localGet(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return localGet(REFRESH_KEY);
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  localSet(ACCESS_KEY, access);
  localSet(REFRESH_KEY, refresh);
}

export async function clearTokens(): Promise<void> {
  localRemove(ACCESS_KEY);
  localRemove(REFRESH_KEY);
}
