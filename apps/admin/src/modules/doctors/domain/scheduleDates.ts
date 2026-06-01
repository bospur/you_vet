/** Локальная дата YYYY-MM-DD (без сдвига UTC). */
export function isoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

/** Даты на период начиная с сегодня (weeks=5 → 31 день, как в admin). */
export function generateDatesFromToday(weeks: number): Date[] {
  const count = weeks === 5 ? 31 : weeks * 7;
  const result: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    result.push(addDays(today, i));
  }
  return result;
}

export function formatScheduleDate(d: Date): string {
  return d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
}

const MONTHS_LONG = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

const WEEKDAYS_LONG = [
  'воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота',
];

export function formatScheduleDateLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${WEEKDAYS_LONG[date.getDay()]}, ${d} ${MONTHS_LONG[m - 1]} ${y}`;
}

export function formatPeriodLabel(from: string, to: string): string {
  return `${formatScheduleDateLong(from)} — ${formatScheduleDateLong(to)}`;
}
