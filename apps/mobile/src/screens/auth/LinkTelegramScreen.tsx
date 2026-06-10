import { useNavigate, useSearchParams } from 'react-router-dom';
import { NestedAppBar } from '../../components/shell/AppBar';
import styles from './LinkTelegramScreen.module.css';

const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME ?? 'VPract_bot';
const BOT_LINK = `https://t.me/${BOT_USERNAME}?start=link`;

export default function LinkTelegramScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('return') ?? '/auth/login';

  return (
    <>
      <NestedAppBar title="Привязка Telegram" />
      <div className={styles.wrap}>
        <ol className={styles.steps}>
          <li>Откройте бота клиники по кнопке ниже</li>
          <li>Нажмите «Поделиться номером» (или 📎 → Контакт)</li>
          <li>Дождитесь ответа «Номер привязан»</li>
          <li>Вернитесь в приложение и войдите по телефону</li>
        </ol>

        <a className={styles.primaryBtn} href={BOT_LINK} target="_blank" rel="noopener noreferrer">
          Открыть @{BOT_USERNAME}
        </a>

        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={() => navigate(`/auth/login?return=${encodeURIComponent(returnUrl)}`)}
        >
          Уже привязал — войти
        </button>
      </div>
    </>
  );
}
