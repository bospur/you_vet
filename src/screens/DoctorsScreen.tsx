import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@telegram-apps/telegram-ui';
import { fetchDoctors } from '../api';
import { useNotification } from '../hooks/useNotification';
import { NavList } from '../components/NavList/NavList';

const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.snzbeachvolleyball25.ru';

export default function DoctorsScreen() {
  const navigate = useNavigate();
  const notify = useNotification();
  const { data, isLoading, isError } = useQuery({ queryKey: ['doctors'], queryFn: fetchDoctors });

  useEffect(() => {
    if (isError) notify('Не удалось загрузить список врачей. Попробуйте позже.', 'error');
  }, [isError, notify]);

  if (isLoading) return <Spinner size="m" />;

  return (
    <NavList
      header="Наши врачи"
      onBack={() => navigate(-1)}
      items={(data ?? []).map((doctor) => ({
        key: doctor.id,
        title: doctor.full_name,
        subtitle: doctor.specialty,
        before: doctor.photo_url
          ? <img src={`${API_URL}${doctor.photo_url}`} alt={doctor.full_name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
          : '👨‍⚕️',
        onClick: () => navigate(`/doctors/${doctor.id}`),
      }))}
    />
  );
}
