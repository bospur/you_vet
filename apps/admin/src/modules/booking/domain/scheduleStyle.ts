import type { BookingServiceType } from '../../../data/source/booking';

export type ScheduleStyle = 'day_capacity' | 'dropoff' | 'time_slots';

export const SCHEDULE_STYLE_LABELS: Record<ScheduleStyle, string> = {
  day_capacity: 'Только количество мест (УЗИ — без сдачи/забора)',
  dropoff: 'Сдача и забор (операции)',
  time_slots: 'Выбор времени при записи',
};

export function defaultScheduleStyle(category: BookingServiceType['category']): ScheduleStyle {
  if (category === 'surgery') return 'dropoff';
  return 'day_capacity';
}

export function scheduleStyleToSlotMode(style: ScheduleStyle): 'day_capacity' | 'fixed_times' {
  return style === 'time_slots' ? 'fixed_times' : 'day_capacity';
}

export function showsDropoffFields(style: ScheduleStyle): boolean {
  return style === 'dropoff';
}

export function showsIntakeWindow(style: ScheduleStyle): boolean {
  return style === 'dropoff' || style === 'time_slots';
}
