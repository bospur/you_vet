import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { emitSessionExpired } from '../auth/sessionEvents';
import { refreshSession } from '../auth/sessionRefresh';
import { clearTokens, getAccessToken } from '../auth/tokenStorage';

// В dev — same-origin + vite proxy, чтобы не упираться в CORS из браузера.
const API_URL = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_URL ?? 'https://api.snzbeachvolleyball25.ru');
const API_PREFIX = import.meta.env.VITE_MOBILE_API_PREFIX ?? '/api/mobile/v1';
const CLINIC_SLUG = import.meta.env.VITE_CLINIC_SLUG ?? 'default';

export const clinicBaseURL = `${API_URL}${API_PREFIX}/clinics/${CLINIC_SLUG}`;
export const authBaseURL = `${API_URL}${API_PREFIX}/auth`;
export const profileBaseURL = `${API_URL}${API_PREFIX}/profile`;
export { API_URL, API_PREFIX, CLINIC_SLUG };

export const apiClient = axios.create({
  baseURL: clinicBaseURL,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (!config || error.response?.status !== 401 || config._retry) {
      return Promise.reject(error);
    }

    config._retry = true;

    const refreshed = await refreshSession();
    if (refreshed) {
      const token = await getAccessToken();
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
      return apiClient.request(config);
    }

    await clearTokens();
    emitSessionExpired();
    return Promise.reject(error);
  },
);
