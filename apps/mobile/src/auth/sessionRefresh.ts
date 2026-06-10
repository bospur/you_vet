import type { TokenPair } from '../api/auth';
import { authBaseURL } from '../api/client';
import { clearTokens, getRefreshToken, setTokens } from './tokenStorage';

export async function refreshSession(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${authBaseURL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      if (res.status === 401) {
        await clearTokens();
      }
      return false;
    }

    const data = (await res.json()) as TokenPair;
    await setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}
