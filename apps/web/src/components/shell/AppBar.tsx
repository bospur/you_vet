import { useNavigate } from 'react-router-dom';
import type { ClinicInfo } from '@you-vet/types';
import { API_URL } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useMobileProfile } from '../../hooks/useMobileProfile';
import styles from './AppBar.module.css';

interface RootAppBarProps {
  info: ClinicInfo | null;
}

export function ProfileHeaderButton() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: profile } = useMobileProfile();

  const goProfile = () => {
    if (isAuthenticated) {
      navigate('/profile');
      return;
    }
    navigate('/auth/login?return=/profile');
  };

  const photoSrc = profile?.photo_url ? `${API_URL}${profile.photo_url}` : null;
  const initial = (profile?.display_name || '?').charAt(0).toUpperCase();

  return (
    <button
      type="button"
      className={styles.profileBtn}
      onClick={goProfile}
      aria-label={isAuthenticated ? 'Личный кабинет' : 'Войти'}
    >
      {isAuthenticated ? (
        photoSrc ? (
          <img src={photoSrc} alt="" className={styles.profileAvatar} />
        ) : (
          <span className={styles.profileFallback}>{initial}</span>
        )
      ) : (
        <svg className={styles.loginIcon} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

export function PhoneButton({ phone }: { phone: string }) {
  return (
    <a href={`tel:${phone}`} className={styles.phoneBtn} aria-label="Позвонить">
      📞
    </a>
  );
}

export function RootAppBar({ info }: RootAppBarProps) {
  const navigate = useNavigate();
  const phone = info?.phone?.replace(/\s/g, '');
  const logoUrl = info?.logo_url ? `${API_URL}${info.logo_url}` : null;

  return (
    <header className={`${styles.bar} ${styles.rootBar}`}>
      <button type="button" className={styles.titleBtn} onClick={() => navigate('/')}>
        {logoUrl && <img src={logoUrl} alt="" className={styles.logo} />}
        <span className={styles.titleText}>{info?.name ?? 'Ветпрактика'}</span>
      </button>
      <div className={styles.actions}>
        {phone && <PhoneButton phone={phone} />}
        <ProfileHeaderButton />
      </div>
    </header>
  );
}

interface NestedAppBarProps {
  title: string;
}

export function NestedAppBar({ title }: NestedAppBarProps) {
  return (
    <header className={styles.bar}>
      <h1 className={styles.nestedTitle}>{title}</h1>
    </header>
  );
}
