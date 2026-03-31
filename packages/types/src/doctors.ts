export type DoctorStatus = 'draft' | 'published';

export interface Doctor {
  id: number;
  clinic_id: number;
  full_name: string;
  specialty: string;
  description: string;
  contacts: string;
  photo_url: string;
  status: DoctorStatus;
  sort_order: number;
}

export interface DoctorInput {
  full_name: string;
  specialty: string;
  description: string;
  contacts: string;
  sort_order: number;
}

export interface DoctorScheduleSlot {
  id: number;
  doctor_id: number;
  day_of_week: number; // 0=Вс, 1=Пн ... 6=Сб
  time_from: string;
  time_to: string;
}

export interface DoctorScheduleException {
  id: number;
  doctor_id: number;
  date: string;
  is_day_off: boolean;
  time_from: string | null;
  time_to: string | null;
}

export interface ClinicSettings {
  clinic_id: number;
  schedule_display_weeks: number;
}

export interface ScheduleEntry {
  doctor_id: number;
  full_name: string;
  specialty: string;
  photo_url: string;
  date: string;
  time_from: string;
  time_to: string;
}
