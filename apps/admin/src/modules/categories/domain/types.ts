export type { Category, CategoryInput } from '@you-vet/types';

// Для отображения в таблице — дополняем именем животного
export interface CategoryRow {
  id: number;
  animal_id: number;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
  animalName: string;
  animalSlug: string;
}

export interface CategoryFormValues {
  animal_id: number;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
}
