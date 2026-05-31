import type { BookingServiceType } from '../../../data/source/booking';

export const CATEGORY_LABELS: Record<BookingServiceType['category'], string> = {
  uzi: 'УЗИ',
  surgery: 'Операции',
  xray: 'Рентген',
};

export const SPECIES_LABELS: Record<BookingServiceType['species_filter'], string> = {
  any: 'Любые животные',
  cats_only: 'Только кошки',
};

export const BOOKING_MODE_LABELS: Record<BookingServiceType['booking_mode'], string> = {
  instant: 'Сразу подтверждено',
  pending_request: 'Нужно подтверждение',
};

export type BookingRequestStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'rescheduled';

export const REQUEST_STATUS_LABELS: Record<BookingRequestStatus, string> = {
  pending: 'Ожидает',
  confirmed: 'Подтверждено',
  rejected: 'Отклонено',
  cancelled: 'Отменено',
  rescheduled: 'Перенесено',
};

export const REQUEST_STATUS_COLOR: Record<BookingRequestStatus, 'warning' | 'success' | 'error' | 'default' | 'info'> = {
  pending: 'warning',
  confirmed: 'success',
  rejected: 'error',
  cancelled: 'default',
  rescheduled: 'info',
};
