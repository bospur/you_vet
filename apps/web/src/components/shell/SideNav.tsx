import { NavLink, useNavigate } from 'react-router-dom';
import type { ClinicInfo } from '@you-vet/types';
import { API_URL } from '../../api/client';
import { PhoneButton, ProfileHeaderButton } from './AppBar';
import { NAV_TABS } from './nav';
import styles from './SideNav.module.css';

interface SideNavProps {
  info: ClinicInfo | null;
}

export function SideNav({ info }: SideNavProps) {
  const navigate = useNavigate();
  const logoUrl = info?.logo_url ? `${API_URL}${info.logo_url}` : null;
  const phone = info?.phone?.replace(/\s/g, '');

  return (
    <aside className={styles.sidebar} aria-label="Основная навигация">
      <button type="button" className={styles.brand} onClick={() => navigate('/')}>
        {logoUrl && <img src={logoUrl} alt="" className={styles.logo} />}
        <span className={styles.brandName}>{info?.name ?? 'Ветпрактика'}</span>
      </button>

      <nav className={styles.nav}>
        {NAV_TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`}
          >
            <span className={styles.icon} aria-hidden>
              {tab.icon}
            </span>
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        {phone && <PhoneButton phone={phone} />}
        <ProfileHeaderButton />
      </div>
    </aside>
  );
}
