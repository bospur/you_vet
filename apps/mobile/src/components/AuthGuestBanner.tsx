import { useNavigate } from 'react-router-dom';
import styles from './AuthGuestBanner.module.css';

export function AuthGuestBanner() {
  const navigate = useNavigate();

  return (
    <div className={styles.banner} role="status">
      <p className={styles.text}>
        Сейчас доступны статьи, врачи и расписание.{' '}
        <button
          type="button"
          className={styles.link}
          onClick={() => navigate('/auth/login?return=/')}
        >
          Войдите в аккаунт
        </button>
        , чтобы записаться на приём и задать вопрос врачу.
      </p>
    </div>
  );
}
