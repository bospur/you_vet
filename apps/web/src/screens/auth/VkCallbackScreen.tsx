import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { completeVkLogin } from '../../auth/vkLogin';
import { parseAuthError } from '../../api/auth';
import styles from './LoginScreen.module.css';

export default function VkCallbackScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshAuthState } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const returnUrl = await completeVkLogin(searchParams);
        if (cancelled) return;
        await refreshAuthState();
        navigate(returnUrl, { replace: true });
      } catch (err) {
        if (cancelled) return;
        setError(parseAuthError(err));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, refreshAuthState, searchParams]);

  return (
    <div className={styles.wrap}>
      {!error ? (
        <p className={styles.lead}>Завершаем вход через VK…</p>
      ) : (
        <>
          <p className={styles.error}>{error}</p>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => navigate('/auth/login', { replace: true })}
          >
            Вернуться ко входу
          </button>
        </>
      )}
    </div>
  );
}
