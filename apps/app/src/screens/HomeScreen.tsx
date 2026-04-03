import { useNavigate } from 'react-router-dom';
import styles from './HomeScreen.module.css';

const MENU = [
  { icon: '🐾', label: 'Первая помощь животным', path: '/animals' },
  { icon: '👨‍⚕️', label: 'Наши врачи', path: '/doctors' },
  { icon: '📅', label: 'Расписание приёма', path: '/schedule' },
  { icon: '✂️', label: 'Груминг', path: '/grooming' },
];

export default function HomeScreen() {
  const navigate = useNavigate();

  return (
    <div className={styles.wrapper}>
      <p className={styles.header}>Ветеринарная клиника</p>
      {MENU.map((item) => (
        <button key={item.path} className={styles.button} onClick={() => navigate(item.path)}>
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
          <span className={styles.arrow}>›</span>
        </button>
      ))}
    </div>
  );
}
