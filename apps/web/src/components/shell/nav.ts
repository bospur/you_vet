import type { AppRole } from '../../auth/mobileUser';

export interface NavTab {
  to: string;
  label: string;
  icon: string;
  end: boolean;
}

export function navTabsForRole(role: AppRole): readonly NavTab[] {
  if (role === 'groomer') {
    return [
      { to: '/', label: 'Главная', icon: '🏠', end: true },
      { to: '/staff/grooming', label: 'Груминг', icon: '✂️', end: false },
      { to: '/chats', label: 'Чаты', icon: '💬', end: false },
    ];
  }
  if (role === 'doctor' || role === 'chief_vet') {
    return [
      { to: '/', label: 'Главная', icon: '🏠', end: true },
      { to: '/staff/booking', label: 'Заявки', icon: '📋', end: false },
      { to: '/chats', label: 'Чаты', icon: '💬', end: false },
    ];
  }
  return [
    { to: '/', label: 'Главная', icon: '🏠', end: true },
    { to: '/booking', label: 'Запись', icon: '📅', end: false },
    { to: '/chats', label: 'Чаты', icon: '💬', end: false },
  ];
}

export const TAB_ROOTS = new Set([
  '/',
  '/booking',
  '/animals',
  '/chats',
  '/staff/booking',
  '/staff/grooming',
]);
