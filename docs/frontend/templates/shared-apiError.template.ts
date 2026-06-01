/**
 * Shared error helper.
 * Copy to: shared/utils/apiError.ts
 */
import { isAxiosError } from 'axios';

export function getApiErrorMessage(error: unknown, fallback = 'Ошибка сервера'): string {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'string' && data.trim()) return data;
    if (data && typeof data === 'object') {
      if ('error' in data) {
        const err = (data as { error: unknown }).error;
        if (typeof err === 'string') return err;
        if (err && typeof err === 'object' && 'message' in err) {
          return String((err as { message: unknown }).message);
        }
      }
      if ('message' in data) {
        return String((data as { message: unknown }).message);
      }
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
