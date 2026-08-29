import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isVkConfigured, startVkLogin } from '../../auth/vkLogin';
import { authRequestCode, parseAuthError } from '../../api/auth';
import { phone } from '../../utils/phone';
import styles from './LoginScreen.module.css';

export default function LoginScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('return') ?? '/';

  const [phoneInput, setPhoneInput] = useState('+7');
  const [loadingVk, setLoadingVk] = useState(false);
  const [loadingPhone, setLoadingPhone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVk = async () => {
    setError(null);
    setLoadingVk(true);
    try {
      await startVkLogin(returnUrl);
    } catch (err) {
      setError(parseAuthError(err));
    } finally {
      setLoadingVk(false);
    }
  };

  const handlePhoneRequest = async () => {
    setError(null);
    const normalized = phone.normalize(phoneInput);
    if (!phone.isValidRF(normalized)) {
      setError('Укажите номер в формате +79XXXXXXXXX');
      return;
    }
    setLoadingPhone(true);
    try {
      await authRequestCode(normalized);
      const qs = new URLSearchParams({ phone: normalized, return: returnUrl });
      navigate(`/auth/verify?${qs.toString()}`);
    } catch (err) {
      const msg = parseAuthError(err);
      if (axiosIsPhoneNotLinked(err)) {
        navigate(`/auth/link-telegram?return=${encodeURIComponent(returnUrl)}`);
        return;
      }
      setError(msg);
    } finally {
      setLoadingPhone(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.brand}>
        <div className={styles.logoMark} aria-hidden>
          +
        </div>
        <h1 className={styles.title}>Ветпрактика</h1>
        <p className={styles.subtitle}>Войдите, чтобы записаться на приём и задавать вопросы</p>
      </div>

      <div className={styles.card}>
        {isVkConfigured() && (
          <button
            type="button"
            className={styles.vkBtn}
            onClick={handleVk}
            disabled={loadingVk || loadingPhone}
          >
            {loadingVk ? 'Подключаем VK…' : 'Продолжить через VK ID'}
          </button>
        )}

        <div className={styles.divider}>
          <span>или</span>
        </div>

        <label className={styles.label} htmlFor="login-phone">
          Номер телефона
        </label>
        <input
          id="login-phone"
          className={styles.input}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+79XXXXXXXXX"
          value={phoneInput}
          onChange={(e) => setPhoneInput(e.target.value)}
        />
        <p className={styles.fieldHint}>Код придёт в Telegram от бота клиники</p>

        <button
          type="button"
          className={styles.primaryBtn}
          onClick={handlePhoneRequest}
          disabled={loadingVk || loadingPhone}
        >
          {loadingPhone ? 'Отправляем код…' : 'Получить код'}
        </button>

        <button
          type="button"
          className={styles.linkBtn}
          onClick={() =>
            navigate(`/auth/link-telegram?return=${encodeURIComponent(returnUrl)}`)
          }
        >
          Как привязать номер в боте?
        </button>

        {error && <p className={styles.error}>{error}</p>}
      </div>

      <button type="button" className={styles.skipBtn} onClick={() => navigate('/')}>
        Продолжить без входа
      </button>
    </div>
  );
}

function axiosIsPhoneNotLinked(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    (err as { response?: { data?: { error?: string } } }).response?.data?.error ===
      'PHONE_NOT_LINKED'
  );
}
