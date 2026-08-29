import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  label?: string;
}

export function ProgressBar({ label }: ProgressBarProps) {
  return (
    <div className={styles.wrap} role="progressbar" aria-label={label ?? 'Загрузка'}>
      <div className={styles.track}>
        <div className={styles.bar} />
      </div>
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}
