import axiosInstance from './axiosInstance';

export interface LoginPayload {
  login: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await axiosInstance.post<LoginResponse>('/api/admin/login', payload);
  return data;
}
