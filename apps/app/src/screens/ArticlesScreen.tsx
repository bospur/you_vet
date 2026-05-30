import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchArticles } from '../api';
import { useNotification } from '../hooks/useNotification';
import { NavList } from '../components/NavList/NavList';
import { Preloader } from '../components/Preloader/Preloader';

export default function ArticlesScreen() {
  const navigate = useNavigate();
  const notify = useNotification();
  const { animalSlug } = useParams<{ animalSlug: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['articles', animalSlug],
    queryFn: () => fetchArticles(animalSlug!),
    enabled: !!animalSlug,
  });

  useEffect(() => {
    if (isError) notify('Не удалось загрузить данные. Попробуйте позже.', 'error');
  }, [isError, notify]);

  if (isLoading) return <Preloader />;

  return (
    <NavList
      header="Статьи"
      onBack={() => navigate(-1)}
      items={(data ?? []).map((article) => ({
        key: article.id,
        title: article.title,
        onClick: () => navigate(`/articles/${article.slug}`),
      }))}
    />
  );
}
