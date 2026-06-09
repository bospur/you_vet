import type { ClinicInfo } from '@you-vet/types';
import { apiClient } from './client';

export const fetchClinicInfo = () =>
  apiClient.get<ClinicInfo>('/clinic-info').then((r) => r.data);
