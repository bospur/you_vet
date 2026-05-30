import styles from './Preloader.module.css';

interface PreloaderProps {
  text?: string;
}

export function Preloader({ text = 'Загружаем...' }: PreloaderProps) {
  return (
    <div className={styles.container}>
      <div className={styles.spinner} aria-hidden />
      {text && <span className={styles.text}>{text}</span>}
    </div>
  );
}
