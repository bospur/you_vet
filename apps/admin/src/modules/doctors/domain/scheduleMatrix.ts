import type { ScheduleEntry } from './types';
import { isoDateLocal } from './scheduleDates';

export interface ScheduleWorkingDoctor {
  doctor_id: number;
  full_name: string;
  specialty: string;
  photo_url: string;
  time_from: string;
  time_to: string;
}

export interface ScheduleDayRow {
  date: string;
  dateObj: Date;
  working: ScheduleWorkingDoctor[];
}

export function buildScheduleMatrix(dates: Date[], entries: ScheduleEntry[]): ScheduleDayRow[] {
  return dates.map((dateObj) => {
    const date = isoDateLocal(dateObj);
    const working = entries
      .filter((e) => e.date === date)
      .map((e) => ({
        doctor_id: e.doctor_id,
        full_name: e.full_name,
        specialty: e.specialty,
        photo_url: e.photo_url,
        time_from: e.time_from,
        time_to: e.time_to,
      }));
    return { date, dateObj, working };
  });
}

export function formatTimeRange(from: string, to: string): string {
  return `${from.slice(0, 5)} – ${to.slice(0, 5)}`;
}

/** Один врач на день — несколько интервалов в одной ячейке при печати. */
export interface ScheduleDoctorDayGroup {
  doctor_id: number;
  full_name: string;
  specialty: string;
  slots: Array<{ time_from: string; time_to: string }>;
}

export function groupWorkingByDoctor(working: ScheduleWorkingDoctor[]): ScheduleDoctorDayGroup[] {
  const map = new Map<number, ScheduleDoctorDayGroup>();

  for (const doc of working) {
    const slot = { time_from: doc.time_from, time_to: doc.time_to };
    const existing = map.get(doc.doctor_id);
    if (existing) {
      existing.slots.push(slot);
    } else {
      map.set(doc.doctor_id, {
        doctor_id: doc.doctor_id,
        full_name: doc.full_name,
        specialty: doc.specialty,
        slots: [slot],
      });
    }
  }

  return Array.from(map.values()).map((group) => ({
    ...group,
    slots: group.slots.sort((a, b) => a.time_from.localeCompare(b.time_from)),
  }));
}
