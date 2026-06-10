import type { ReactNode } from 'react';
import styles from './NavList.module.css';

interface NavItem {
  key: string | number;
  icon?: string;
  title: string;
  subtitle?: string;
  before?: ReactNode;
  onClick: () => void;
}

interface NavListProps {
  header?: string;
  items: NavItem[];
  onBack?: () => void;
}

export function NavList({ header, items, onBack }: NavListProps) {
  return (
    <div className={styles.wrapper}>
      {header && <p className={styles.header}>{header}</p>}
      {items.map((item) => (
        <button key={item.key} type="button" className={styles.item} onClick={item.onClick}>
          {item.before && <span className={styles.itemIcon}>{item.before}</span>}
          {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
          <span className={styles.itemText}>
            <span className={styles.itemTitle}>{item.title}</span>
            {item.subtitle && <span className={styles.itemSubtitle}>{item.subtitle}</span>}
          </span>
          <span className={styles.arrow}>›</span>
        </button>
      ))}
      {onBack && (
        <button type="button" className={styles.back} onClick={onBack}>
          ‹ Назад
        </button>
      )}
    </div>
  );
}
