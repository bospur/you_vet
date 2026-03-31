export type { Animal, AnimalInput } from '@you-vet/types';

export interface AnimalFormValues {
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
}
