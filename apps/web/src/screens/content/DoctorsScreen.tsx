import { type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FaCommentDots } from 'react-icons/fa6';
import { API_URL } from '../../api/client';
import { openConsult } from '../../api/chats';
import { fetchDoctors } from '../../api/content';
import { useAuth } from '../../auth/AuthContext';
import { useAppRole } from '../../auth/useAppRole';
import { NestedAppBar } from '../../components/shell/AppBar';
import { DoctorAvatar } from '../../components/DoctorAvatar';
import { Preloader } from '../../components/Preloader';
import contentStyles from './content.module.css';
import styles from './DoctorsScreen.module.css';

const CommentIcon = FaCommentDots as ComponentType<{ size?: number }>;

export default function DoctorsScreen() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isStaff } = useAppRole();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['doctors'],
    queryFn: fetchDoctors,
  });

  const write = useMutation({
    mutationFn: (doctorId: number) => openConsult(doctorId),
    onSuccess: (room) => navigate(`/chats/${room.id}`),
  });

  const startChat = (doctorId: number) => {
    if (!isAuthenticated) {
      navigate(`/auth/login?return=${encodeURIComponent(`/doctors/${doctorId}?write=1`)}`);
      return;
    }
    write.mutate(doctorId);
  };

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
          {write.isError && (
            <p className={contentStyles.empty}>Не удалось открыть чат с врачом</p>
          )}
          <div className={styles.grid}>
            {(data ?? []).map((doctor) => (
              <article key={doctor.id} className={styles.card}>
                <button
                  type="button"
                  className={styles.cardMain}
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
                {!isStaff && (
                  <button
                    type="button"
                    className={styles.writeIcon}
                    aria-label={`Написать ${doctor.full_name}`}
                    title="Написать врачу"
                    disabled={write.isPending}
                    onClick={() => startChat(doctor.id)}
                  >
                    <CommentIcon size={16} />
                  </button>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
