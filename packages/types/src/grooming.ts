export interface GroomingBreed {
  id: number;
  clinic_id: number;
  breed: string;
  duration: number; // минуты
  price: number | null;
  description: string | null;
}

export interface GroomingBreedInput {
  breed: string;
  duration: number;
  price?: number;
  description?: string;
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
