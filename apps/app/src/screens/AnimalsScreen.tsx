import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@telegram-apps/telegram-ui';
import { fetchAnimals } from '../api';
import { useNotification } from '../hooks/useNotification';
import { NavList } from '../components/NavList/NavList';

export default function AnimalsScreen() {
  const navigate = useNavigate();
  const notify = useNotification();
  const { data, isLoading, isError } = useQuery({ queryKey: ['animals'], queryFn: fetchAnimals });

  useEffect(() => {
    if (isError) notify('Не удалось загрузить данные. Попробуйте позже.', 'error');
  }, [isError, notify]);

  if (isLoading) return <Spinner size="m" />;

  return (
    <NavList
      header="Выберите животное"
      onBack={() => navigate(-1)}
      items={(data ?? []).map((animal) => ({
        key: animal.id,
        title: animal.name,
        onClick: () => navigate(`/animals/${animal.slug}/categories`),
      }))}
    />
  );
}
