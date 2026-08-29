import { emitSessionExpired } from '../auth/sessionEvents';
import { refreshSession } from '../auth/sessionRefresh';
import { clearTokens, getAccessToken } from '../auth/tokenStorage';

export async function authenticatedFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = await getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(url, { ...init, headers });

  if (response.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      const nextToken = await getAccessToken();
      if (nextToken) {
        headers.set('Authorization', `Bearer ${nextToken}`);
      } else {
        headers.delete('Authorization');
      }
      response = await fetch(url, { ...init, headers });
    }

    if (response.status === 401) {
      await clearTokens();
      emitSessionExpired();
    }
  }

  return response;
}
