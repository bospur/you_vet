import axios from 'axios';
import { API_BASE_URL } from '../../shared/config/env';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  if (config.data instanceof FormData && config.headers) {
    // Axios 1.x: AxiosHeaders.delete — иначе boundary не подставится (часто на мобильном Safari)
    if (typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
    } else {
      delete config.headers['Content-Type'];
    }
  }
  return config;
});

export default axiosInstance;
