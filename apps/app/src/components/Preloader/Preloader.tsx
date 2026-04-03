import { CatPreloader } from '@you-vet/cat';
import styles from './Preloader.module.css';

export function Preloader() {
  return (
    <div className={styles.container}>
      <CatPreloader text="Загружаем..." />
    </div>
  );
}
