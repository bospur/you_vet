import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authStaffLogin, parseAuthError } from '../../api/auth';
import { useAuth } from '../../auth/AuthContext';
import { setTokens } from '../../auth/tokenStorage';
import styles from './LoginScreen.module.css';

export default function StaffLoginScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('return') ?? '/';
  const { refreshAuthState } = useAuth();

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!login.trim() || !password) {
      setError('Укажите логин и пароль');
      return;
    }
    setLoading(true);
    try {
      const tokens = await authStaffLogin(login.trim(), password);
      await setTokens(tokens.access_token, tokens.refresh_token);
      await refreshAuthState();
      navigate(returnUrl.startsWith('/') ? returnUrl : '/', { replace: true });
    } catch (err) {
      setError(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.brand}>
        <div className={styles.logoMark} aria-hidden>
          +
        </div>
        <h1 className={styles.title}>Вход для сотрудников</h1>
        <p className={styles.subtitle}>Логин и пароль выдаёт администратор клиники</p>
      </div>

      <form className={styles.card} onSubmit={(e) => void handleSubmit(e)}>
        <label className={styles.label} htmlFor="staff-login">
          Логин
        </label>
        <input
          id="staff-login"
          className={styles.input}
          autoComplete="username"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
        />
        <p className={styles.fieldHint}>Как в карточке врача в админке</p>

        <label className={styles.label} htmlFor="staff-password">
          Пароль
        </label>
        <input
          id="staff-password"
          className={styles.input}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className={styles.fieldHint}>Если пароль потерян — его сбрасывают в админке</p>

        <button type="submit" className={styles.primaryBtn} disabled={loading}>
          {loading ? 'Входим…' : 'Войти'}
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </form>

      <button type="button" className={styles.skipBtn} onClick={() => navigate('/')}>
        На главную
      </button>
    </div>
  );
}
