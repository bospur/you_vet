const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

export async function getAccessToken(): Promise<string | null> {
  return localStorage.getItem(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return localStorage.getItem(REFRESH_KEY);
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export async function clearTokens(): Promise<void> {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}
