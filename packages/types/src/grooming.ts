export interface GroomingBreed {
  id: number;
  clinic_id: number;
  breed: string;
  service_name: string;
  duration: number; // минуты
  price_from: number | null;
  price_to: number | null;
  description: string | null;
}

export interface GroomingBreedServiceInput {
  id?: number;
  service_name: string;
  duration: number;
  price_from?: number | null;
  price_to?: number | null;
}

export interface GroomingBreedGroupInput {
  breed: string;
  description?: string | null;
  services: GroomingBreedServiceInput[];
  /** При переименовании породы — прежнее название */
  original_breed?: string;
}

/** @deprecated одиночное создание — используйте GroomingBreedGroupInput */
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
  service_name: string;
  duration: number;
  price_from: number | null;
  price_to: number | null;
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
