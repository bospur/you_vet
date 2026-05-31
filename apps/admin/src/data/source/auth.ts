import axiosInstance from './axiosInstance';

export interface LoginPayload {
  login: string;
  password: string;
}

export interface AuthUserResponse {
  id: number;
  clinic_id: number;
  role: 'admin' | 'editor' | 'groomer';
}

export interface LoginResponse {
  user: AuthUserResponse;
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await axiosInstance.post<LoginResponse>('/api/admin/login', payload);
  return data;
}

export async function logoutRequest(): Promise<void> {
  await axiosInstance.post('/api/admin/logout');
}

export async function fetchCurrentUser(): Promise<AuthUserResponse> {
  const { data } = await axiosInstance.get<AuthUserResponse>('/api/admin/me');
  return data;
}
