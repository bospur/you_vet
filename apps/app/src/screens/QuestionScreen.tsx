import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { submitClientQuestion } from '../api';
import { useNotification } from '../hooks/useNotification';
import { getApiErrorMessage } from '../utils/apiError';
import styles from './booking/booking.module.css';

const MIN_LEN = 10;
const MAX_LEN = 2000;

export default function QuestionScreen() {
  const navigate = useNavigate();
  const notify = useNotification();
  const [text, setText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const trimmed = text.trim();
  const len = trimmed.length;
  const canSubmit = len >= MIN_LEN && len <= MAX_LEN;

  const mutation = useMutation({
    mutationFn: submitClientQuestion,
    onSuccess: () => {
      setFormError(null);
      setSent(true);
      notify('Вопрос отправлен', 'success');
    },
    onError: (err: unknown) => {
      setFormError(getApiErrorMessage(err, 'Не удалось отправить вопрос'));
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || mutation.isPending) return;
    setFormError(null);
    mutation.mutate(trimmed);
  };

  if (sent) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.header}>Задать вопрос</p>
        <p className={styles.instructions}>
          Вопрос отправлен в клинику. Ответ придёт в этот чат с ботом.
        </p>
        <button type="button" className={styles.submit} onClick={() => navigate('/', { replace: true })}>
          На главную
        </button>
        <button type="button" className={styles.back} onClick={() => navigate(-1)}>
          ‹ Назад
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <p className={styles.header}>Задать вопрос</p>
      <p className={styles.instructions}>
        Опишите ситуацию — врачи увидят вопрос в рабочем чате и ответят вам в Telegram.
      </p>

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
          />
          <span className={styles.charCount}>
            {len} / {MAX_LEN}
            {len > 0 && len < MIN_LEN ? ` (минимум ${MIN_LEN})` : ''}
          </span>
        </div>

        {formError && <p className={styles.formError}>{formError}</p>}

        <p className={styles.submitHint}>Не больше 5 вопросов в день</p>

        <button type="submit" className={styles.submit} disabled={!canSubmit || mutation.isPending}>
          {mutation.isPending ? 'Отправка…' : 'Отправить'}
        </button>
      </form>

      <button type="button" className={styles.back} onClick={() => navigate(-1)}>
        ‹ Назад
      </button>
    </div>
  );
}
