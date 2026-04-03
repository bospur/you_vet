import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchGroomingSchedule } from "../api";
import { Preloader } from "../components/Preloader/Preloader";
import { useNotification } from "../hooks/useNotification";
import styles from "./GroomingScheduleScreen.module.css";

const DAY_NAMES = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Пн–Вс

function formatTime(t: string): string {
  return t.slice(0, 5); // "09:00:00" → "09:00"
}

export default function GroomingScheduleScreen() {
  const navigate = useNavigate();
  const notify = useNotification();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["grooming-schedule"],
    queryFn: fetchGroomingSchedule,
  });

  useEffect(() => {
    if (isError && error) notify(error.message, "error");
  }, [isError, notify, error]);

  if (isLoading) return <Preloader />;

  const slotMap = new Map((data ?? []).map((s) => [s.day_of_week, s]));

  return (
    <div className={styles.wrapper}>
      <p className={styles.header}>График работы кабинета</p>
      {slotMap.size === 0 && (
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
      <button className={styles.back} onClick={() => navigate(-1)}>
        ‹ Назад
      </button>
    </div>
  );
}
