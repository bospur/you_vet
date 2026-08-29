import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchGroomingSchedule } from '../../api/content';
import { NestedAppBar } from '../../components/shell/AppBar';
import { Preloader } from '../../components/Preloader';
import styles from './GroomingScheduleScreen.module.css';

const DAY_NAMES = [
  'Воскресенье',
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function formatTime(t: string): string {
  return t.slice(0, 5);
}

export default function GroomingScheduleScreen() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['grooming-schedule'],
    queryFn: fetchGroomingSchedule,
  });

  if (isLoading) return <Preloader />;

  const slotMap = new Map((data ?? []).map((s) => [s.day_of_week, s]));

  return (
    <>
      <NestedAppBar title="График работы" />
      <div className={styles.wrapper}>
        {isError && <p className={styles.empty}>Не удалось загрузить график</p>}
        {!isError && slotMap.size === 0 && (
          <p className={styles.empty}>График ещё не настроен</p>
        )}
        {DAY_ORDER.map((dow) => {
          const slot = slotMap.get(dow);
          return (
            <div
              key={dow}
              className={`${styles.row} ${slot ? styles.rowActive : styles.rowOff}`}
            >
              <span className={styles.dayName}>{DAY_NAMES[dow]}</span>
              {slot ? (
                <span className={styles.hours}>
                  {formatTime(slot.time_from)} — {formatTime(slot.time_to)}
                </span>
              ) : (
                <span className={styles.closed}>Выходной</span>
              )}
            </div>
          );
        })}
        <button type="button" className={styles.back} onClick={() => navigate(-1)}>
          ‹ Назад
        </button>
      </div>
    </>
  );
}
