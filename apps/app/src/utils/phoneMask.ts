/** Цифры телефона РФ: 10 цифр после кода страны (без ведущей 7/8). */
export function phoneDigitsOnly(value: string): string {
  let d = value.replace(/\D/g, '');
  if (d.startsWith('8')) d = d.slice(1);
  if (d.startsWith('7')) d = d.slice(1);
  return d.slice(0, 10);
}

export function formatRuPhone(digits: string): string {
  const d = phoneDigitsOnly(digits);
  if (d.length === 0) return '';
  let out = '+7';
  if (d.length > 0) out += ` (${d.slice(0, 3)}`;
  if (d.length >= 3) out += ')';
  if (d.length > 3) out += ` ${d.slice(3, 6)}`;
  if (d.length > 6) out += `-${d.slice(6, 8)}`;
  if (d.length > 8) out += `-${d.slice(8, 10)}`;
  return out;
}

/** Для API: +79001234567 или пустая строка. */
export function phoneToApi(digits: string): string {
  const d = phoneDigitsOnly(digits);
  return d.length === 0 ? '' : `+7${d}`;
}
