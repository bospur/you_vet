export interface Animal {
  id: number;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
}

export interface AnimalInput {
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
}

export interface Category {
  id: number;
  animal_id: number;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
}

export interface CategoryInput {
  animal_id: number;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
}
