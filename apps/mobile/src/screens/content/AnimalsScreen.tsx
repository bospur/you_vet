import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAnimals } from '../../api/content';
import { NavList } from '../../components/NavList';
import { Preloader } from '../../components/Preloader';
import styles from './content.module.css';

export default function AnimalsScreen() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['animals'],
    queryFn: fetchAnimals,
  });

  if (isLoading) return <Preloader />;

  if (isError) {
    return (
      <div className={styles.emptyWrap}>
        <p className={styles.empty}>Не удалось загрузить данные</p>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className={styles.emptyWrap}>
        <p className={styles.empty}>Пока нет материалов</p>
      </div>
    );
  }

  return (
    <NavList
      header="Выберите животное"
      items={data.map((animal) => ({
        key: animal.id,
        title: animal.name,
        icon: animal.icon || undefined,
        onClick: () => navigate(`/animals/${animal.slug}/articles`),
      }))}
    />
  );
}
