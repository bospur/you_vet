import { NavLink } from 'react-router-dom';
import { useAppRole } from '../../auth/useAppRole';
import { navTabsForRole } from './nav';
import styles from './TabBar.module.css';

export function TabBar() {
  const { role } = useAppRole();
  const tabs = navTabsForRole(role);
  return (
    <nav className={styles.tabBar} aria-label="Основная навигация">
      {tabs.map((tab) => (
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
