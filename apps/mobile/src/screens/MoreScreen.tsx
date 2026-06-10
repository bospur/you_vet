import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { API_URL } from '../api/client';
import { fetchProfile } from '../api/profile';
import { NestedAppBar } from '../components/shell/AppBar';
import { useAuth } from '../auth/AuthContext';
import { authMethodLabel, displayUserName, maskPhone } from '../auth/mobileUser';
import styles from './MoreScreen.module.css';

export default function MoreScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['mobile-profile'],
    queryFn: fetchProfile,
    enabled: isAuthenticated,
  });

  const handleLogout = async () => {
    await logout();
  };

  const photoSrc = profile?.photo_url ? `${API_URL}${profile.photo_url}` : null;
  const name = profile?.display_name || (user ? displayUserName(user) : '');

  return (
    <>
      <NestedAppBar title="Ещё" />
      <div className={styles.wrap}>
        <h2 className={styles.sectionTitle}>Аккаунт</h2>

        {isLoading ? (
          <p className={styles.muted}>Загрузка…</p>
        ) : isAuthenticated && user ? (
          <div className={styles.card}>
            {photoSrc ? (
              <img src={photoSrc} alt="" className={styles.avatarImg} />
            ) : (
              <div className={styles.avatar} aria-hidden>
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <p className={styles.name}>{name}</p>
            {(profile?.phone || user.phone) && (
              <p className={styles.meta}>{maskPhone(profile?.phone || user.phone!)}</p>
            )}
            <p className={styles.badge}>{authMethodLabel(user)}</p>
            <button
              type="button"
              className={styles.profileBtn}
              onClick={() => navigate('/profile')}
            >
              Личный кабинет
            </button>
            <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
              Выйти
            </button>
          </div>
        ) : (
          <div className={styles.card}>
            <p className={styles.muted}>Вы не вошли в аккаунт</p>
            <p className={styles.hint}>
              Войдите, чтобы записаться на приём и управлять профилем.
            </p>
            <button
              type="button"
              className={styles.loginBtn}
              onClick={() => navigate('/auth/login?return=/more')}
            >
              Войти
            </button>
          </div>
        )}
      </div>
    </>
  );
}
