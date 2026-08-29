import { NavLink } from 'react-router-dom';
import { NAV_TABS } from './nav';
import styles from './TabBar.module.css';

export function TabBar() {
  return (
    <nav className={styles.tabBar} aria-label="Основная навигация">
      {NAV_TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
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
