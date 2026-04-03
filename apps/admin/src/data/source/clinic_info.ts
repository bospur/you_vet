import axiosInstance from './axiosInstance';

export interface ClinicInfo {
  id: number;
  clinic_id: number;
  name: string;
  description: string;
  phone: string;
  address: string;
  email: string;
  website: string;
  logo_url: string;
  banner_url: string;
  updated_at: string;
}

export interface ClinicInfoInput {
  name: string;
  description: string;
  phone: string;
  address: string;
  email: string;
  website: string;
}

export async function getClinicInfo(): Promise<ClinicInfo> {
  const { data } = await axiosInstance.get<ClinicInfo>('/api/admin/clinic-info');
  return data;
}

export async function updateClinicInfo(input: ClinicInfoInput): Promise<ClinicInfo> {
  const { data } = await axiosInstance.put<ClinicInfo>('/api/admin/clinic-info', input);
  return data;
}

export async function uploadClinicLogo(file: File): Promise<ClinicInfo> {
  const form = new FormData();
  form.append('image', file);
  const { data } = await axiosInstance.post<ClinicInfo>('/api/admin/clinic-info/logo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function uploadClinicBanner(file: File): Promise<ClinicInfo> {
  const form = new FormData();
  form.append('image', file);
  const { data } = await axiosInstance.post<ClinicInfo>('/api/admin/clinic-info/banner', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
