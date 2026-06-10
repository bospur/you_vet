import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchArticle } from '../../api/content';
import { NestedAppBar } from '../../components/shell/AppBar';
import { Preloader } from '../../components/Preloader';
import styles from './ArticleScreen.module.css';

export default function ArticleScreen() {
  const { articleSlug } = useParams<{ articleSlug: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['article', articleSlug],
    queryFn: () => fetchArticle(articleSlug!),
    enabled: !!articleSlug,
  });

  if (isLoading) return <Preloader />;

  if (isError || !data) {
    return (
      <>
        <NestedAppBar title="Статья" />
        <div className={styles.wrapper}>
          <p className={styles.error}>Не удалось загрузить статью</p>
          <button type="button" className={styles.back} onClick={() => navigate(-1)}>
            ‹ Назад
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <NestedAppBar title={data.title.length > 28 ? `${data.title.slice(0, 28)}…` : data.title} />
      <div className={styles.wrapper}>
        <h1 className={styles.title}>{data.title}</h1>
        <div className={styles.content} dangerouslySetInnerHTML={{ __html: data.content }} />
        <button type="button" className={styles.back} onClick={() => navigate(-1)}>
          ‹ Назад
        </button>
      </div>
    </>
  );
}
