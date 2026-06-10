import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchArticles } from '../../api/content';
import { NestedAppBar } from '../../components/shell/AppBar';
import { NavList } from '../../components/NavList';
import { Preloader } from '../../components/Preloader';
import styles from './content.module.css';

export default function ArticlesScreen() {
  const navigate = useNavigate();
  const { animalSlug } = useParams<{ animalSlug: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['articles', animalSlug],
    queryFn: () => fetchArticles(animalSlug!),
    enabled: !!animalSlug,
  });

  return (
    <>
      <NestedAppBar title="Статьи" />
      {isLoading ? (
        <Preloader />
      ) : isError ? (
        <div className={styles.emptyWrap}>
          <p className={styles.empty}>Не удалось загрузить статьи</p>
        </div>
      ) : (
        <NavList
          items={(data ?? []).map((article) => ({
            key: article.id,
            title: article.title,
            onClick: () => navigate(`/articles/${article.slug}`),
          }))}
          onBack={() => navigate('/animals')}
        />
      )}
    </>
  );
}
