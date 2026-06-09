import axios from 'axios';
import { getAccessToken } from '../auth/tokenStorage';

const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.snzbeachvolleyball25.ru';
const API_PREFIX = import.meta.env.VITE_MOBILE_API_PREFIX ?? '/api/mobile/v1';
const CLINIC_SLUG = import.meta.env.VITE_CLINIC_SLUG ?? 'default';

export const clinicBaseURL = `${API_URL}${API_PREFIX}/clinics/${CLINIC_SLUG}`;
export const authBaseURL = `${API_URL}${API_PREFIX}/auth`;
export { API_URL, CLINIC_SLUG };

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
