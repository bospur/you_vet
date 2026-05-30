import axios from 'axios';
import { getTelegramInitData } from '../utils/telegramInitData';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://api.snzbeachvolleyball25.ru';
const CLINIC_SLUG = import.meta.env.VITE_CLINIC_SLUG ?? 'default';

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/clinics/${CLINIC_SLUG}`,
});

apiClient.interceptors.request.use((config) => {
  const initData = getTelegramInitData();
  if (initData) {
    config.headers.set('X-Telegram-Init-Data', initData);
    config.headers.set('Authorization', `tma ${initData}`);
  }
  return config;
});
