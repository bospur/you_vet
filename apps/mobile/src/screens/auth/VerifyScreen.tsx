import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { NestedAppBar } from '../../components/shell/AppBar';
import { useAuth } from '../../auth/AuthContext';
import { authVerifyCode, parseAuthError } from '../../api/auth';
import styles from './VerifyScreen.module.css';

export default function VerifyScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshAuthState } = useAuth();

  const phone = searchParams.get('phone') ?? '';
  const returnUrl = searchParams.get('return') ?? '/';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) {
      setError('Введите 6 цифр из Telegram');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authVerifyCode(phone, digits);
      await refreshAuthState();
      navigate(returnUrl, { replace: true });
    } catch (err) {
      setError(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NestedAppBar title="Код из Telegram" onBack={() => navigate(-1)} />
      <div className={styles.wrap}>
        <p className={styles.hint}>
          Код отправлен в Telegram для номера <strong>{phone}</strong>
        </p>
        <input
          className={styles.input}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        />
        <button
          type="button"
          className={styles.submit}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Проверяем…' : 'Войти'}
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </>
  );
}
