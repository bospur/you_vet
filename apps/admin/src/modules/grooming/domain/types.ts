// day_of_week: 0=Вс, 1=Пн, 2=Вт, 3=Ср, 4=Чт, 5=Пт, 6=Сб (как в doctor_schedules)
export const DAY_NAMES_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
export const DAY_NAMES_FULL = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

export interface GroomingBreed {
  id: number;
  clinic_id: number;
  breed: string;
  duration: number; // минуты
  price: number | null;
  description: string | null;
}

export interface GroomingBreedFormValues {
  breed: string;
  duration: number;
  price: string; // строка для инпута, конвертим при отправке
  description: string;
}

export interface GroomingTemplateSlot {
  id: number;
  clinic_id: number;
  day_of_week: number;
  time_from: string;
  time_to: string;
}

export interface GroomingTemplateInput {
  day_of_week: number;
  time_from: string;
  time_to: string;
}

export interface GroomingAppointment {
  id: number;
  clinic_id: number;
  breed_id: number;
  breed: string;
  duration: number;
  price: number | null;
  date: string;
  pet_name: string;
  owner_phone: string;
  start_time: string;
  end_time: string;
}

export interface GroomingAppointmentInput {
  breed_id: number;
  date: string;
  pet_name: string;
  owner_phone: string;
  start_time: string;
}
