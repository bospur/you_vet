import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchArticle } from '../api';
import { useNotification } from '../hooks/useNotification';
import { Preloader } from '../components/Preloader/Preloader';
import { ScrollToTopFab } from '../components/ScrollToTopFab/ScrollToTopFab';
import styles from './ArticleScreen.module.css';

export default function ArticleScreen() {
  const { articleSlug } = useParams<{ articleSlug: string }>();
  const navigate = useNavigate();
  const notify = useNotification();
  const topAnchorRef = useRef<HTMLButtonElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['article', articleSlug],
    queryFn: () => fetchArticle(articleSlug!),
    enabled: !!articleSlug,
  });

  useEffect(() => {
    if (isError) notify('Не удалось загрузить статью. Попробуйте позже.', 'error');
  }, [isError, notify]);

  if (isLoading) return <Preloader />;
  if (!data) return null;

  return (
    <div className={styles.wrapper}>
      <button
        ref={topAnchorRef}
        type="button"
        className={styles.back}
        onClick={() => navigate(-1)}
      >
        ‹ Назад
      </button>
      <h1 className={styles.title}>{data.title}</h1>
      <div
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: data.content }}
      />
      <ScrollToTopFab anchorRef={topAnchorRef} />
    </div>
  );
}
