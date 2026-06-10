import { useNavigate } from 'react-router-dom';
import { NestedAppBar } from '../components/shell/AppBar';
import { useAuth } from '../auth/AuthContext';
import { authMethodLabel, displayUserName, maskPhone } from '../auth/mobileUser';
import styles from './MoreScreen.module.css';

export default function MoreScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <NestedAppBar title="Ещё" />
      <div className={styles.wrap}>
        <h2 className={styles.sectionTitle}>Аккаунт</h2>

        {isLoading ? (
          <p className={styles.muted}>Загрузка…</p>
        ) : isAuthenticated && user ? (
          <div className={styles.card}>
            <div className={styles.avatar} aria-hidden>
              {displayUserName(user).charAt(0).toUpperCase()}
            </div>
            <p className={styles.name}>{displayUserName(user)}</p>
            {user.phone && <p className={styles.meta}>{maskPhone(user.phone)}</p>}
            <p className={styles.badge}>{authMethodLabel(user)}</p>
            <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
              Выйти
            </button>
          </div>
        ) : (
          <div className={styles.card}>
            <p className={styles.muted}>Вы не вошли в аккаунт</p>
            <p className={styles.hint}>
              Войдите, чтобы записаться на приём и видеть свои заявки.
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
