import type { ReactNode } from 'react';
import styles from './NavGrid.module.css';

export interface NavGridItem {
  key: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

interface NavGridProps {
  items: NavGridItem[];
}

export function NavGrid({ items }: NavGridProps) {
  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <button key={item.key} className={styles.card} onClick={item.onClick}>
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
