import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '../api';
import { useNotification } from '../hooks/useNotification';
import { NavList } from '../components/NavList/NavList';
import { Preloader } from '../components/Preloader/Preloader';

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

  if (isLoading) return <Preloader />;

  return (
    <NavList
      header="Выберите раздел"
      onBack={() => navigate(-1)}
      items={(data ?? []).map((category) => ({
        key: category.id,
        title: category.name,
        icon: category.icon || undefined,
        onClick: () => navigate(`/animals/${animalSlug}/categories/${category.slug}/articles`),
      }))}
    />
  );
}
