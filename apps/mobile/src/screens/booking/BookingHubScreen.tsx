import { useNavigate } from 'react-router-dom';
import { NestedAppBar } from '../../components/shell/AppBar';
import { useAuth } from '../../auth/AuthContext';
import { displayUserName } from '../../auth/mobileUser';
import styles from './BookingHubScreen.module.css';

export default function BookingHubScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const goProtected = (path: string) => {
    if (!isAuthenticated) {
      navigate(`/auth/login?return=${encodeURIComponent(path)}`);
      return;
    }
    navigate(path);
  };

  return (
    <>
      <NestedAppBar title="Запись на приём" onBack={() => navigate('/')} />
      <div className={styles.wrap}>
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
            Вы вошли как <strong>{displayUserName(user)}</strong>
          </p>
        ) : (
          <p className={styles.hint}>
            Войдите через VK ID или по телефону (код в Telegram), чтобы записаться.
          </p>
        )}
      </div>
    </>
  );
}
