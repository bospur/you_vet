import { isAxiosError } from 'axios';

export function bookingApiErrorMessage(err: unknown, fallback: string): string {
  if (!isAxiosError(err)) {
    return fallback;
  }
  const status = err.response?.status;
  const raw = err.response?.data;
  const detail =
    typeof raw === 'string'
      ? raw.trim()
      : raw && typeof raw === 'object' && 'message' in raw && typeof raw.message === 'string'
        ? raw.message
        : '';

  if (status === 404) {
    return detail || 'Услуга не найдена';
  }
  if (status === 400) {
    return detail || 'Неверный запрос';
  }
  if (status === 500) {
    if (/booking_requests|relation.*does not exist/i.test(detail)) {
      return 'Сервер не обновлён: нет таблицы заявок. Перезапустите API (миграция 015).';
    }
    return detail ? `${fallback}: ${detail}` : `${fallback} (ошибка сервера 500)`;
  }
  if (detail) {
    return detail;
  }
  return fallback;
}
