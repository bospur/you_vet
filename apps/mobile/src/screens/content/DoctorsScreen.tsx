import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { API_URL } from '../../api/client';
import { fetchDoctors } from '../../api/content';
import { NestedAppBar } from '../../components/shell/AppBar';
import { DoctorAvatar } from '../../components/DoctorAvatar';
import { NavList } from '../../components/NavList';
import { Preloader } from '../../components/Preloader';
import styles from './content.module.css';

export default function DoctorsScreen() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['doctors'],
    queryFn: fetchDoctors,
  });

  return (
    <>
      <NestedAppBar title="Наши врачи" />
      {isLoading ? (
        <Preloader />
      ) : isError ? (
        <div className={styles.emptyWrap}>
          <p className={styles.empty}>Не удалось загрузить список врачей</p>
        </div>
      ) : (
        <NavList
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
          onBack={() => navigate('/')}
        />
      )}
    </>
  );
}
