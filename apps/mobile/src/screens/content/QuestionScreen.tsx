import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { submitClientQuestion } from '../../api/content';
import { useAuth } from '../../auth/AuthContext';
import { NestedAppBar } from '../../components/shell/AppBar';
import { getApiErrorMessage } from '../../utils/apiError';
import styles from './QuestionScreen.module.css';

const MIN_LEN = 10;
const MAX_LEN = 2000;

export default function QuestionScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [text, setText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/auth/login?return=${encodeURIComponent('/question')}`, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const trimmed = text.trim();
  const len = trimmed.length;
  const canSubmit = len >= MIN_LEN && len <= MAX_LEN;
  const needsTelegram = isAuthenticated && user && !user.telegramUserId;

  const mutation = useMutation({
    mutationFn: submitClientQuestion,
    onSuccess: () => {
      setFormError(null);
      setSent(true);
    },
    onError: (err: unknown) => {
      setFormError(getApiErrorMessage(err, 'Не удалось отправить вопрос'));
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || mutation.isPending || needsTelegram) return;
    setFormError(null);
    mutation.mutate(trimmed);
  };

  if (!isAuthenticated) return null;

  if (sent) {
    return (
      <>
        <NestedAppBar title="Задать вопрос" />
        <div className={styles.wrapper}>
          <p className={styles.instructions}>
            Вопрос отправлен в клинику. Ответ придёт в Telegram от бота @VPract_bot.
          </p>
          <button type="button" className={styles.submit} onClick={() => navigate('/', { replace: true })}>
            На главную
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <NestedAppBar title="Задать вопрос" />
      <div className={styles.wrapper}>
        <p className={styles.instructions}>
          Опишите ситуацию — врачи увидят вопрос в рабочем чате и ответят вам в Telegram.
        </p>

        {needsTelegram && (
          <div className={styles.warn}>
            <p>Чтобы получить ответ, привяжите Telegram к аккаунту.</p>
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => navigate('/auth/link-telegram?return=/question')}
            >
              Привязать Telegram
            </button>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="question-text">
              Ваш вопрос
            </label>
            <textarea
              id="question-text"
              className={styles.textarea}
              rows={6}
              maxLength={MAX_LEN}
              placeholder="Например: можно ли записать кота на УЗИ без направления?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!!needsTelegram}
            />
            <span className={styles.charCount}>
              {len} / {MAX_LEN}
              {len > 0 && len < MIN_LEN ? ` (минимум ${MIN_LEN})` : ''}
            </span>
          </div>

          {formError && <p className={styles.formError}>{formError}</p>}

          <p className={styles.submitHint}>Не больше 5 вопросов в день</p>

          <button
            type="submit"
            className={styles.submit}
            disabled={!canSubmit || mutation.isPending || !!needsTelegram}
          >
            {mutation.isPending ? 'Отправка…' : 'Отправить'}
          </button>
        </form>
      </div>
    </>
  );
}
