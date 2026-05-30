import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchFeaturedArticles } from '../../api';
import styles from './FeaturedArticles.module.css';

export function FeaturedArticles() {
  const navigate = useNavigate();
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['featured-articles'],
    queryFn: fetchFeaturedArticles,
  });

  if (isLoading || articles.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Рекомендуем</h2>
      <div className={styles.list}>
        {articles.map((article) => (
          <button
            key={article.id}
            type="button"
            className={styles.item}
            onClick={() => navigate(`/articles/${article.slug}`)}
          >
            <span className={styles.itemText}>
              <span className={styles.title}>{article.title}</span>
              <span className={styles.subtitle}>{article.animal_name}</span>
            </span>
            <span className={styles.arrow} aria-hidden>›</span>
          </button>
        ))}
      </div>
    </section>
  );
}
