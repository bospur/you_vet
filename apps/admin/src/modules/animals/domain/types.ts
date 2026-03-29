export interface Animal {
  id: number;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
}

export interface AnimalFormValues {
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
}
