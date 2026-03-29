import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@telegram-apps/telegram-ui';
import { fetchArticles } from '../api';
import { useNotification } from '../hooks/useNotification';
import { NavList } from '../components/NavList/NavList';

export default function ArticlesScreen() {
  const navigate = useNavigate();
  const notify = useNotification();
  const { animalSlug, categorySlug } = useParams<{
    animalSlug: string;
    categorySlug: string;
  }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['articles', animalSlug, categorySlug],
    queryFn: () => fetchArticles(animalSlug!, categorySlug!),
    enabled: !!animalSlug && !!categorySlug,
  });

  useEffect(() => {
    if (isError) notify('Не удалось загрузить данные. Попробуйте позже.', 'error');
  }, [isError, notify]);

  if (isLoading) return <Spinner size="m" />;

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
