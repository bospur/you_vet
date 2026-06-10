import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { NestedAppBar } from '../../components/shell/AppBar';
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

  const handleVk = () => {
    setError(null);
    setLoadingVk(true);
    try {
      startVkLogin(returnUrl);
    } catch (err) {
      setError(parseAuthError(err));
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
    <>
      <NestedAppBar title="Вход" onBack={() => navigate(-1)} />
      <div className={styles.wrap}>
        <p className={styles.lead}>
          Войдите, чтобы записаться на приём и видеть свои заявки.
        </p>

        {isVkConfigured() && (
          <button
            type="button"
            className={styles.vkBtn}
            onClick={handleVk}
            disabled={loadingVk || loadingPhone}
          >
            <span className={styles.vkIcon}>VK</span>
            {loadingVk ? 'Подключаем VK…' : 'Войти через VK ID'}
          </button>
        )}

        {!isVkConfigured() && (
          <p className={styles.sectionHint}>
            VK ID: добавьте <code>VITE_VK_APP_ID</code> в <code>.env.local</code> и пересоберите APK.
          </p>
        )}

        <div className={styles.divider}>или</div>

        <h2 className={styles.sectionTitle}>Телефон + код в Telegram</h2>
        <p className={styles.sectionHint}>
          Нужен Telegram: код придёт в личные сообщения от бота после привязки номера.
        </p>

        <div className={styles.phoneRow}>
          <input
            className={styles.input}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+79XXXXXXXXX"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
          />
        </div>

        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={handlePhoneRequest}
          disabled={loadingVk || loadingPhone}
        >
          {loadingPhone ? 'Отправляем…' : 'Получить код в Telegram'}
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
    </>
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
