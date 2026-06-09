import { NestedAppBar } from '../components/shell/AppBar';
import styles from './PlaceholderScreen.module.css';

interface PlaceholderScreenProps {
  title: string;
  note?: string;
}

export function PlaceholderScreen({ title, note }: PlaceholderScreenProps) {
  return (
    <>
      <NestedAppBar title={title} />
      <div className={styles.wrap}>
        <p className={styles.title}>{title}</p>
        <p className={styles.note}>{note ?? 'Экран в разработке (sprint 2+).'}</p>
      </div>
    </>
  );
}
