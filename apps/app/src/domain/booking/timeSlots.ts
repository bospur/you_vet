import type { BookingAvailabilityDay, BookingTimeSlot } from '../../api';

function parseClock(s: string): { hour: number; min: number } | null {
  const part = s.slice(0, 5);
  const m = /^(\d{1,2}):(\d{2})$/.exec(part);
  if (!m) return null;
  const hour = Number(m[1]);
  const min = Number(m[2]);
  if (hour < 0 || hour > 23 || min < 0 || min > 59) return null;
  return { hour, min };
}

function formatClock(totalMin: number): string {
  const hour = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function clockToMinutes(s: string): number | null {
  const c = parseClock(s);
  if (!c) return null;
  return c.hour * 60 + c.min;
}

/** Локальная дата YYYY-MM-DD (для сравнения с датой записи). */
export function localDateISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Слот уже начался или прошёл (по локальному времени устройства). */
export function isSlotTimeInPast(slotTime: string, now: Date = new Date()): boolean {
  const slotMin = clockToMinutes(slotTime);
  if (slotMin === null) return true;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return slotMin <= nowMin;
}

/** Генерация слотов по окну приёма (как на сервере). */
export function generateSlotTimes(from: string, to: string, durationMin: number): string[] {
  const duration = durationMin > 0 ? durationMin : 30;
  const start = parseClock(from);
  const end = parseClock(to);
  if (!start || !end) return [];
  const startMin = start.hour * 60 + start.min;
  const endMin = end.hour * 60 + end.min;
  if (endMin <= startMin) return [];
  const times: string[] = [];
  for (let t = startMin; t + duration <= endMin; t += duration) {
    times.push(formatClock(t));
  }
  return times;
}

/** Свободные слоты на день: API или fallback по intake_from / intake_to. */
export function availableSlotsForDay(
  day: BookingAvailabilityDay,
  durationMin: number,
  now: Date = new Date(),
): BookingTimeSlot[] {
  const fromApi = (day.time_slots ?? []).filter((s) => s.remaining > 0);
  let slots: BookingTimeSlot[];
  if (fromApi.length > 0) {
    slots = fromApi;
  } else if (!day.intake_from || !day.intake_to) {
    slots = [];
  } else {
    const times = generateSlotTimes(day.intake_from, day.intake_to, durationMin);
    slots = times.map((time) => ({
      time,
      booked_slots: 0,
      max_slots: 1,
      remaining: 1,
    }));
  }

  if (day.date === localDateISO(now)) {
    slots = slots.filter((s) => !isSlotTimeInPast(s.time, now));
  }
  return slots;
}
