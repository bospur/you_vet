export type UserRole = 'admin' | 'editor' | 'groomer';

export interface User {
  id: number;
  clinic_id: number;
  login: string;
  role: UserRole;
}
