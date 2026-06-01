import { DAY_DISPLAY_ORDER } from './days';

export type DayDraft = {
  enabled: boolean;
  max_per_day: number;
  slot_mode: 'day_capacity' | 'fixed_times';
  intake_from: string;
  intake_to: string;
  pickup_after: string;
};

export const DEFAULT_DAY: Omit<DayDraft, 'enabled' | 'slot_mode'> = {
  max_per_day: 10,
  intake_from: '12:00',
  intake_to: '13:00',
  pickup_after: '17:00',
};

export function emptyWeeklyDraft(slotMode: 'day_capacity' | 'fixed_times' = 'day_capacity'): Record<number, DayDraft> {
  const d: Record<number, DayDraft> = {};
  for (const day of DAY_DISPLAY_ORDER) {
    d[day] = { enabled: false, slot_mode: slotMode, ...DEFAULT_DAY };
  }
  return d;
}

export function weeklyDraftFromRules(
  weekly: {
    day_of_week: number;
    max_per_day: number;
    intake_from: string | null;
    intake_to: string | null;
    pickup_after: string | null;
    slot_mode: string;
  }[],
): Record<number, DayDraft> {
  const slotMode = weekly.some((r) => r.slot_mode === 'fixed_times') ? 'fixed_times' : 'day_capacity';
  const d = emptyWeeklyDraft(slotMode);
  for (const rule of weekly) {
    d[rule.day_of_week] = {
      enabled: true,
      max_per_day: rule.max_per_day,
      slot_mode: rule.slot_mode === 'fixed_times' ? 'fixed_times' : 'day_capacity',
      intake_from: (rule.intake_from ?? '09:00').slice(0, 5),
      intake_to: (rule.intake_to ?? '18:00').slice(0, 5),
      pickup_after: (rule.pickup_after ?? '17:00').slice(0, 5),
    };
  }
  return d;
}

export function weeklyDraftsEqual(a: Record<number, DayDraft>, b: Record<number, DayDraft>): boolean {
  for (const day of DAY_DISPLAY_ORDER) {
    const da = a[day];
    const db = b[day];
    if (!da || !db) return false;
    if (da.enabled !== db.enabled) return false;
    if (!da.enabled) continue;
    if (
      da.max_per_day !== db.max_per_day
      || da.slot_mode !== db.slot_mode
      || da.intake_from !== db.intake_from
      || da.intake_to !== db.intake_to
      || da.pickup_after !== db.pickup_after
    ) {
      return false;
    }
  }
  return true;
}

export function countEnabledDays(draft: Record<number, DayDraft>): number {
  return DAY_DISPLAY_ORDER.filter((day) => draft[day]?.enabled).length;
}

export function weeklyDraftSyncKey(serviceId: number, weekly: { day_of_week: number; max_per_day: number }[]): string {
  const rules = weekly
    .map((r) => `${r.day_of_week}:${r.max_per_day}`)
    .sort()
    .join('|');
  return `${serviceId}|${rules}`;
}
