import styles from './Preloader.module.css';

interface PreloaderProps {
  text?: string;
  full?: boolean;
}

export function Preloader({ text = 'Загружаем…', full = false }: PreloaderProps) {
  return (
    <div className={`${styles.container} ${full ? styles.full : ''}`} role="status" aria-live="polite">
      <div className={styles.spinner} aria-hidden />
      {text && <span className={styles.text}>{text}</span>}
    </div>
  );
}
