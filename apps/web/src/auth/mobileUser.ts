export interface MobileUserProfile {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  vkId: number | null;
  telegramUserId: number | null;
}

export function parseMobileAccessToken(token: string): MobileUserProfile | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)) as Record<string, unknown>;
    if (payload.typ !== 'access' || payload.sub == null) return null;

    return {
      id: Number(payload.sub),
      name: typeof payload.name === 'string' && payload.name.trim() ? payload.name.trim() : null,
      phone: typeof payload.phone === 'string' && payload.phone.trim() ? payload.phone.trim() : null,
      email: typeof payload.email === 'string' && payload.email.trim() ? payload.email.trim() : null,
      vkId: payload.vk_id != null ? Number(payload.vk_id) : null,
      telegramUserId: payload.tg_id != null ? Number(payload.tg_id) : null,
    };
  } catch {
    return null;
  }
}

/** Имя-заглушка с сервера VK, когда first/last name пустые */
function isPlaceholderName(name: string): boolean {
  const trimmed = name.trim();
  return /^VK(\s+ID)?\s+\d+$/i.test(trimmed) || trimmed === 'Пользователь VK';
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('7')) {
    return `+7 ${digits.slice(1, 4)} *** ${digits.slice(-2)}`;
  }
  if (phone.length > 4) {
    return `${phone.slice(0, 4)} *** ${phone.slice(-2)}`;
  }
  return phone;
}

export function displayUserName(user: MobileUserProfile): string {
  if (user.name && !isPlaceholderName(user.name)) return user.name;
  if (user.phone) return maskPhone(user.phone);
  if (user.email) return user.email;
  return 'Пользователь';
}

export function displayNameFromSources(
  user: MobileUserProfile,
  profile?: { display_name?: string; phone?: string } | null,
): string {
  const candidates = [profile?.display_name, user.name];
  for (const raw of candidates) {
    const name = raw?.trim();
    if (name && !isPlaceholderName(name)) return name;
  }
  const phone = user.phone?.trim() || profile?.phone?.trim();
  if (phone) return maskPhone(phone);
  if (user.email) return user.email;
  return 'Пользователь';
}

export function authMethodLabel(user: MobileUserProfile): string {
  if (user.telegramUserId) return 'Телефон + Telegram';
  if (user.email && user.phone) return 'Почта и телефон';
  if (user.email) return 'Почта';
  if (user.phone) return 'Телефон';
  if (user.vkId) return 'VK ID';
  return 'Вход выполнен';
}
