export type {
  Doctor,
  DoctorStatus,
  DoctorInput,
  DoctorScheduleSlot,
  DoctorScheduleException,
  ClinicSettings,
  ScheduleEntry,
} from '@you-vet/types';

export interface DoctorFormValues {
  full_name: string;
  specialty: string;
  description: string;
  contacts: string;
  sort_order: number;
}

export const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
