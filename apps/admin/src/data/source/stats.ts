import axiosInstance from './axiosInstance';

export interface StatsSummary {
  today: number;
  last_7_days: number;
  last_30_days: number;
  total: number;
}

export const fetchStatsSummary = () =>
  axiosInstance.get<StatsSummary>('/stats/summary').then((r) => r.data);
