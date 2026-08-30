import { NavLink } from 'react-router-dom';
import type { ClinicInfo } from '@you-vet/types';
import { API_URL } from '../../api/client';
import { useAppRole } from '../../auth/useAppRole';
import { ProfileHeaderButton } from './AppBar';
import { navTabsForRole } from './nav';
import styles from './TopBar.module.css';

interface TopBarProps {
  info: ClinicInfo | null;
}

export function TopBar({ info }: TopBarProps) {
  const { role } = useAppRole();
  const tabs = navTabsForRole(role);
  const phone = info?.phone?.replace(/\s/g, '');
  const logoUrl = info?.logo_url ? `${API_URL}${info.logo_url}` : null;

  return (
    <header className={styles.bar}>
      <NavLink to="/" className={styles.brand} end>
        {logoUrl ? (
          <img src={logoUrl} alt="" className={styles.logo} />
        ) : (
          <span className={styles.logoFallback} aria-hidden />
        )}
        <span className={styles.brandName}>{info?.name ?? 'Ветпрактика'}</span>
      </NavLink>

      <nav className={styles.nav} aria-label="Основная навигация">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.actions}>
        {phone && (
          <a href={`tel:${phone}`} className={styles.callBtn}>
            Позвонить
          </a>
        )}
        <ProfileHeaderButton compact />
      </div>
    </header>
  );
}
