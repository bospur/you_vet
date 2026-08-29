import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  authRequestCode,
  fetchAuthOptions,
  parseAuthError,
  type AuthChannel,
  type AuthOptions,
} from '../../api/auth';
import { phone } from '../../utils/phone';
import styles from './LoginScreen.module.css';

const DEFAULT_OPTIONS: AuthOptions = { telegram: true, email: false, whatsapp: false };

export default function LoginScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('return') ?? '/';

  const [options, setOptions] = useState<AuthOptions>(DEFAULT_OPTIONS);
  const [channel, setChannel] = useState<AuthChannel>('telegram');
  const [phoneInput, setPhoneInput] = useState('+7');
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAuthOptions()
      .then((opts) => {
        if (cancelled) return;
        setOptions(opts);
        if (opts.email) setChannel('email');
        else if (opts.telegram) setChannel('telegram');
        else if (opts.whatsapp) setChannel('whatsapp');
      })
      .catch(() => {
        /* оставляем telegram */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRequest = async () => {
    setError(null);
    setLoading(true);
    try {
      if (channel === 'email') {
        const email = emailInput.trim();
        if (!email.includes('@')) {
          setError('Укажите корректный email');
          return;
        }
        await authRequestCode({ channel: 'email', email });
        const qs = new URLSearchParams({ channel: 'email', email, return: returnUrl });
        navigate(`/auth/verify?${qs.toString()}`);
        return;
      }

      const normalized = phone.normalize(phoneInput);
      if (!phone.isValidRF(normalized)) {
        setError('Укажите номер в формате +79XXXXXXXXX');
        return;
      }
      await authRequestCode({ channel, phone: normalized });
      const qs = new URLSearchParams({ channel, phone: normalized, return: returnUrl });
      navigate(`/auth/verify?${qs.toString()}`);
    } catch (err) {
      const msg = parseAuthError(err);
      if (channel === 'telegram' && axiosIsPhoneNotLinked(err)) {
        navigate(`/auth/link-telegram?return=${encodeURIComponent(returnUrl)}`);
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const submitLabel =
    channel === 'email'
      ? 'Получить код на почту'
      : channel === 'whatsapp'
        ? 'Получить код в WhatsApp'
        : 'Получить код в Telegram';

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
        <div className={styles.channels} role="tablist" aria-label="Способ входа">
          {options.email && (
            <button
              type="button"
              role="tab"
              aria-selected={channel === 'email'}
              className={channel === 'email' ? styles.channelActive : styles.channel}
              onClick={() => {
                setChannel('email');
                setError(null);
              }}
            >
              Почта
            </button>
          )}
          <button
            type="button"
            role="tab"
            aria-selected={channel === 'telegram'}
            className={channel === 'telegram' ? styles.channelActive : styles.channel}
            onClick={() => {
              setChannel('telegram');
              setError(null);
            }}
          >
            Telegram
          </button>
          {options.whatsapp && (
            <button
              type="button"
              role="tab"
              aria-selected={channel === 'whatsapp'}
              className={channel === 'whatsapp' ? styles.channelActive : styles.channel}
              onClick={() => {
                setChannel('whatsapp');
                setError(null);
              }}
            >
              WhatsApp
            </button>
          )}
        </div>

        {channel === 'email' ? (
          <>
            <label className={styles.label} htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              className={styles.input}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <p className={styles.fieldHint}>Код придёт на эту почту</p>
          </>
        ) : (
          <>
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
            <p className={styles.fieldHint}>
              {channel === 'whatsapp'
                ? 'Код придёт в WhatsApp на этот номер'
                : 'Код придёт в Telegram от бота клиники — если номер уже привязан'}
            </p>
          </>
        )}

        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() => void handleRequest()}
          disabled={loading}
        >
          {loading ? 'Отправляем код…' : submitLabel}
        </button>

        {channel === 'telegram' && (
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() =>
              navigate(`/auth/link-telegram?return=${encodeURIComponent(returnUrl)}`)
            }
          >
            Как привязать номер в боте?
          </button>
        )}

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
