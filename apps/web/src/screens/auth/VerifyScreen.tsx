import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { NestedAppBar } from '../../components/shell/AppBar';
import { useAuth } from '../../auth/AuthContext';
import { authVerifyCode, parseAuthError, type AuthChannel } from '../../api/auth';
import { setTokens } from '../../auth/tokenStorage';
import styles from './VerifyScreen.module.css';

function parseChannel(raw: string | null): AuthChannel {
  if (raw === 'email' || raw === 'whatsapp') return raw;
  return 'telegram';
}

export default function VerifyScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshAuthState } = useAuth();

  const channel = parseChannel(searchParams.get('channel'));
  const phone = searchParams.get('phone') ?? '';
  const email = searchParams.get('email') ?? '';
  const returnUrl = searchParams.get('return') ?? '/';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title =
    channel === 'email' ? 'Код с почты' : channel === 'whatsapp' ? 'Код из WhatsApp' : 'Код из Telegram';
  const hintTarget =
    channel === 'email' ? email : phone;
  const hintWhere =
    channel === 'email' ? 'на почту' : channel === 'whatsapp' ? 'в WhatsApp' : 'в Telegram';

  const handleSubmit = async () => {
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) {
      setError('Введите 6 цифр из сообщения');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const tokens = await authVerifyCode({
        channel,
        phone: phone || undefined,
        email: email || undefined,
        code: digits,
      });
      await setTokens(tokens.access_token, tokens.refresh_token);
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
      <NestedAppBar title={title} />
      <div className={styles.wrap}>
        <p className={styles.hint}>
          Код отправлен {hintWhere}
          {hintTarget ? (
            <>
              {' '}
              для <strong>{hintTarget}</strong>
            </>
          ) : null}
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
          onClick={() => void handleSubmit()}
          disabled={loading}
        >
          {loading ? 'Проверяем…' : 'Войти'}
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </>
  );
}
