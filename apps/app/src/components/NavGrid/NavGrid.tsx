import type { ReactNode } from 'react';
import { hapticLight } from '../../utils/haptic';
import styles from './NavGrid.module.css';

export interface NavGridItem {
  key: string;
  icon?: ReactNode;
  label?: string;
  subtitle?: string;
  onClick?: () => void;
  skeleton?: boolean;
}

interface NavGridProps {
  items: NavGridItem[];
}

const CARD_ANIM: Record<string, string> = {
  animals: styles.cardArticles,
  doctors: styles.cardDoctors,
  schedule: styles.cardSchedule,
  booking: styles.cardBooking,
  grooming: styles.cardGrooming,
};

export function NavGrid({ items }: NavGridProps) {
  return (
    <div className={styles.grid}>
      {items.map((item) =>
        item.skeleton ? (
          <div key={item.key} className={`${styles.card} ${styles.cardSkeleton}`} aria-hidden>
            <span className={styles.skeletonIcon} />
            <span className={styles.labelWrap}>
              <span className={styles.skeletonLabel} />
              <span className={styles.skeletonSubtitle} />
            </span>
          </div>
        ) : (
          <button
            key={item.key}
            type="button"
            className={`${styles.card} ${CARD_ANIM[item.key] ?? ''}`}
            onClick={() => {
              hapticLight();
              item.onClick?.();
            }}
          >
            {item.icon && <span className={styles.icon}>{item.icon}</span>}
            <span className={styles.labelWrap}>
              <span className={styles.label}>{item.label}</span>
              {item.subtitle && <span className={styles.subtitle}>{item.subtitle}</span>}
            </span>
          </button>
        ),
      )}
    </div>
  );
}
