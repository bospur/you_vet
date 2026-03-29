import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@telegram-apps/telegram-ui';
import { fetchCategories } from '../api';
import { useNotification } from '../hooks/useNotification';
import { NavList } from '../components/NavList/NavList';

export default function CategoriesScreen() {
  const navigate = useNavigate();
  const notify = useNotification();
  const { animalSlug } = useParams<{ animalSlug: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['categories', animalSlug],
    queryFn: () => fetchCategories(animalSlug!),
    enabled: !!animalSlug,
  });

  useEffect(() => {
    if (isError) notify('Не удалось загрузить данные. Попробуйте позже.', 'error');
  }, [isError, notify]);

  if (isLoading) return <Spinner size="m" />;

  return (
    <NavList
      header="Выберите раздел"
      onBack={() => navigate(-1)}
      items={(data ?? []).map((category) => ({
        key: category.id,
        title: category.name,
        onClick: () => navigate(`/animals/${animalSlug}/categories/${category.slug}/articles`),
      }))}
    />
  );
}
