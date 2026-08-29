import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { API_URL } from '../../api/client';
import { fetchDoctors } from '../../api/content';
import { NestedAppBar } from '../../components/shell/AppBar';
import { DoctorAvatar } from '../../components/DoctorAvatar';
import { Preloader } from '../../components/Preloader';
import contentStyles from './content.module.css';
import styles from './DoctorsScreen.module.css';

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
        <div className={contentStyles.emptyWrap}>
          <p className={contentStyles.empty}>Не удалось загрузить список врачей</p>
        </div>
      ) : (
        <div className={styles.wrap}>
          <div className={styles.grid}>
            {(data ?? []).map((doctor) => (
              <button
                key={doctor.id}
                type="button"
                className={styles.card}
                onClick={() => navigate(`/doctors/${doctor.id}`)}
              >
                <div className={styles.photoWrap}>
                  <DoctorAvatar
                    name={doctor.full_name}
                    photoUrl={doctor.photo_url ? `${API_URL}${doctor.photo_url}` : undefined}
                    variant="square"
                  />
                </div>
                <div className={styles.body}>
                  <p className={styles.name}>{doctor.full_name}</p>
                  {doctor.specialty && (
                    <p className={styles.specialty}>{doctor.specialty}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
