import { NavLink } from 'react-router-dom';
import styles from './TabBar.module.css';

const tabs = [
  { to: '/', label: 'Главная', icon: '🏠', end: true },
  { to: '/booking', label: 'Запись', icon: '📅' },
  { to: '/animals', label: 'Статьи', icon: '📚' },
  { to: '/more', label: 'Ещё', icon: '⋯' },
] as const;

export function TabBar() {
  return (
    <nav className={styles.tabBar} aria-label="Основная навигация">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={'end' in tab ? tab.end : false}
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ''}`}
        >
          <span className={styles.icon} aria-hidden>
            {tab.icon}
          </span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
