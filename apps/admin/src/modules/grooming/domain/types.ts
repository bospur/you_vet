export type {
  GroomingBreed,
  GroomingBreedGroupInput,
  GroomingBreedServiceInput,
  GroomingTemplateSlot,
  GroomingTemplateInput,
  GroomingAppointment,
  GroomingAppointmentInput,
} from '@you-vet/types';

// day_of_week: 0=Вс, 1=Пн, 2=Вт, 3=Ср, 4=Чт, 5=Пт, 6=Сб (как в doctor_schedules)
export const DAY_NAMES_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
export const DAY_NAMES_FULL = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

export interface GroomingServiceFormValues {
  service_name: string;
  duration: number;
  price_from: string;
  price_to: string;
}

export interface GroomingBreedGroupFormValues {
  breed: string;
  description: string;
  services: GroomingServiceFormValues[];
}

export interface GroomingBreedGroup {
  breed: string;
  description: string | null;
  services: import('@you-vet/types').GroomingBreed[];
}
