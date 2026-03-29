import { useMemo, useState } from 'react';
import type { Animal } from '../../../animals/domain/types';
import type { CategoryRow } from '../../domain/types';

interface UseCategoriesTableLogicProps {
  animals: Animal[];
  data: CategoryRow[];
}

export function useCategoriesTableLogic({ animals, data }: UseCategoriesTableLogicProps) {
  // По умолчанию открыт первый аккордеон
  const [expanded, setExpanded] = useState<number | null>(animals[0]?.id ?? null);

  const grouped = useMemo(() => {
    return animals.map((animal) => ({
      animal,
      categories: data
        .filter((c) => c.animal_id === animal.id)
        .sort((a, b) => a.sort_order - b.sort_order),
    }));
  }, [animals, data]);

  const toggle = (animalId: number) =>
    setExpanded((prev) => (prev === animalId ? null : animalId));

  return { grouped, expanded, toggle };
}
