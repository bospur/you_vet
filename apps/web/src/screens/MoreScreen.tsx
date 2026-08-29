import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import styles from './MoreScreen.module.css';

export default function MoreScreen() {
  const queryClient = useQueryClient();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    queryClient.removeQueries({ queryKey: ['mobile-profile'] });
  };

  return (
    <div className={styles.wrap}>
      <h1 className={styles.pageTitle}>Ещё</h1>

      {isAuthenticated ? (
        <section className={styles.section}>
          <p className={styles.hint}>
            Профиль и настройки — в правом верхнем углу на главной.
          </p>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            Выйти из аккаунта
          </button>
        </section>
      ) : (
        <section className={styles.section}>
          <p className={styles.hint}>
            Нажмите иконку входа в правом верхнем углу, чтобы авторизоваться и
            открыть запись на приём и вопросы врачу.
          </p>
        </section>
      )}
    </div>
  );
}
