export function normalize(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) {
    return `+7${digits.slice(1)}`;
  }
  if (digits.length === 11 && digits.startsWith('7')) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+7${digits}`;
  }
  if (raw.startsWith('+')) {
    return `+${digits}`;
  }
  return raw.trim();
}

export function isValidRF(value: string): boolean {
  return /^\+79\d{9}$/.test(value);
}

export const phone = { normalize, isValidRF };
