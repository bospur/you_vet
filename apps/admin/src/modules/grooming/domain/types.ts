export type {
  GroomingBreed,
  GroomingBreedInput,
  GroomingTemplateSlot,
  GroomingTemplateInput,
  GroomingAppointment,
  GroomingAppointmentInput,
} from '@you-vet/types';

// day_of_week: 0=Вс, 1=Пн, 2=Вт, 3=Ср, 4=Чт, 5=Пт, 6=Сб (как в doctor_schedules)
export const DAY_NAMES_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
export const DAY_NAMES_FULL = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

export interface GroomingBreedFormValues {
  breed: string;
  duration: number;
  price: string; // строка для инпута, конвертим при отправке
  description: string;
}
