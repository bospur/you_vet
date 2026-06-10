export interface MobileUserProfile {
  id: number;
  name: string | null;
  phone: string | null;
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
      vkId: payload.vk_id != null ? Number(payload.vk_id) : null,
      telegramUserId: payload.tg_id != null ? Number(payload.tg_id) : null,
    };
  } catch {
    return null;
  }
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
  if (user.name) return user.name;
  if (user.phone) return maskPhone(user.phone);
  if (user.vkId) return `VK ID ${user.vkId}`;
  return 'Пользователь';
}

export function authMethodLabel(user: MobileUserProfile): string {
  if (user.vkId && user.phone) return 'VK ID и телефон';
  if (user.vkId) return 'VK ID';
  if (user.phone || user.telegramUserId) return 'Телефон + Telegram';
  return 'Вход выполнен';
}
