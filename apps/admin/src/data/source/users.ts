import axiosInstance from './axiosInstance';

export interface User {
  id: number;
  login: string;
  role: 'admin' | 'editor' | 'groomer' | 'manager';
}

export interface CreateUserInput {
  login: string;
  password: string;
  role: 'admin' | 'editor' | 'groomer' | 'manager';
}

export async function getUsers(): Promise<User[]> {
  const { data } = await axiosInstance.get<User[]>('/api/admin/users');
  return data ?? [];
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const { data } = await axiosInstance.post<User>('/api/admin/users', input);
  return data;
}

export async function deleteUser(id: number): Promise<void> {
  await axiosInstance.delete(`/api/admin/users/${id}`);
}
