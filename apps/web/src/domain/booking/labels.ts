export type BookingCategory = 'uzi' | 'surgery' | 'xray';
export type BookingMode = 'instant' | 'pending_request';
export type BookingRequestStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'rescheduled';

export const CATEGORY_LABELS: Record<BookingCategory, string> = {
  uzi: 'УЗИ',
  surgery: 'Операции',
  xray: 'Рентген',
};

export const SPECIES_LABELS = {
  any: 'Любые животные',
  cats_only: 'Только кошки',
} as const;

export const BOOKING_MODE_HINT: Record<BookingMode, string> = {
  instant: 'Подтверждение сразу после отправки',
  pending_request: 'Клиника подтвердит запись',
};

export const REQUEST_STATUS_LABELS: Record<BookingRequestStatus, string> = {
  pending: 'Ожидает подтверждения',
  confirmed: 'Подтверждено',
  rejected: 'Отклонено',
  cancelled: 'Отменено',
  rescheduled: 'Перенесено',
};

export const REQUEST_STATUS_CLASS: Record<BookingRequestStatus, string> = {
  pending: 'statusPending',
  confirmed: 'statusConfirmed',
  rejected: 'statusRejected',
  cancelled: 'statusCancelled',
  rescheduled: 'statusRescheduled',
};

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

export function formatBookingDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = WEEKDAYS[date.getDay()];
  return `${weekday}, ${d} ${MONTHS[m - 1]}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}
