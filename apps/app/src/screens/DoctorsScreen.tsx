import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchDoctors } from '../api';
import { useNotification } from '../hooks/useNotification';
import { NavList } from '../components/NavList/NavList';
import { DoctorAvatar } from '../components/DoctorAvatar/DoctorAvatar';
import { Preloader } from '../components/Preloader/Preloader';

const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.snzbeachvolleyball25.ru';

export default function DoctorsScreen() {
  const navigate = useNavigate();
  const notify = useNotification();
  const { data, isLoading, isError } = useQuery({ queryKey: ['doctors'], queryFn: fetchDoctors });

  useEffect(() => {
    if (isError) notify('Не удалось загрузить список врачей. Попробуйте позже.', 'error');
  }, [isError, notify]);

  if (isLoading) return <Preloader />;

  return (
    <NavList
      header="Наши врачи"
      onBack={() => navigate(-1)}
      items={(data ?? []).map((doctor) => ({
        key: doctor.id,
        title: doctor.full_name,
        subtitle: doctor.specialty,
        before: (
          <DoctorAvatar
            name={doctor.full_name}
            photoUrl={doctor.photo_url ? `${API_URL}${doctor.photo_url}` : undefined}
            size={40}
          />
        ),
        onClick: () => navigate(`/doctors/${doctor.id}`),
      }))}
    />
  );
}
