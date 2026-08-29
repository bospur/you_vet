export const NAV_TABS = [
  { to: '/', label: 'Главная', icon: '🏠', end: true },
  { to: '/booking', label: 'Запись', icon: '📅', end: false },
  { to: '/animals', label: 'Статьи', icon: '📚', end: false },
  { to: '/more', label: 'Ещё', icon: '⋯', end: false },
] as const;
