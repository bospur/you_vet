import type { GroomingBreed } from '@you-vet/types';

export function formatPriceRange(from: number | null, to: number | null): string {
  if (from == null && to == null) return '—';
  if (from != null && to != null) {
    if (from === to) return `${formatRub(from)} ₽`;
    return `${formatRub(from)}–${formatRub(to)} ₽`;
  }
  const single = from ?? to;
  return single != null ? `${formatRub(single)} ₽` : '—';
}

function formatRub(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
}

export function parseOptionalPrice(raw: string): number | null {
  const t = raw.trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function groupBreedsByName(breeds: GroomingBreed[]): import('./types').GroomingBreedGroup[] {
  const map = new Map<string, import('./types').GroomingBreedGroup>();
  for (const b of breeds) {
    const key = b.breed;
    const existing = map.get(key);
    if (existing) {
      existing.services.push(b);
      if (b.description && !existing.description) {
        existing.description = b.description;
      }
    } else {
      map.set(key, {
        breed: b.breed,
        description: b.description,
        services: [b],
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.breed.localeCompare(b.breed, 'ru'));
}

export function breedServiceLabel(b: GroomingBreed, multiService: boolean): string {
  if (!multiService || b.service_name === 'Стрижка') {
    return b.breed;
  }
  return `${b.breed} — ${b.service_name}`;
}
