import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { displayNameFromSources } from '../../auth/mobileUser';
import { useMobileProfile } from '../../hooks/useMobileProfile';
import styles from './BookingHubScreen.module.css';

export default function BookingHubScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { data: profile } = useMobileProfile();

  const goProtected = (path: string) => {
    if (!isAuthenticated) {
      navigate(`/auth/login?return=${encodeURIComponent(path)}`);
      return;
    }
    navigate(path);
  };

  return (
    <div className={styles.wrap}>
      <h1 className={styles.pageTitle}>Запись на приём</h1>
        <button type="button" className={styles.row} onClick={() => goProtected('/booking/new')}>
          <span className={styles.icon}>📅</span>
          <span>
            <span className={styles.rowTitle}>Записаться</span>
            <span className={styles.rowSub}>Выбор услуги и даты</span>
          </span>
        </button>
        <button type="button" className={styles.row} onClick={() => goProtected('/booking/requests')}>
          <span className={styles.icon}>📋</span>
          <span>
            <span className={styles.rowTitle}>Мои заявки</span>
            <span className={styles.rowSub}>Статус ваших записей</span>
          </span>
        </button>
        {isAuthenticated && user ? (
          <p className={styles.authOk}>
            Вы вошли как <strong>{displayNameFromSources(user, profile)}</strong>
          </p>
        ) : (
          <p className={styles.hint}>
            Войдите по телефону или email, чтобы записаться.
          </p>
        )}
    </div>
  );
}
