import { useEffect, useState, type RefObject } from 'react';
import styles from './ScrollToTopFab.module.css';

type ScrollToTopFabProps = {
  /** Элемент вверху контента (например, кнопка «Назад»). FAB показывается, когда он ушёл из видимой области. */
  anchorRef: RefObject<HTMLElement | null>;
};

export function ScrollToTopFab({ anchorRef }: ScrollToTopFabProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0, root: null, rootMargin: '0px 0px -8px 0px' },
    );

    observer.observe(anchor);
    return () => observer.disconnect();
  }, [anchorRef]);

  if (!visible) return null;

  const scrollToTop = () => {
    anchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      className={styles.fab}
      aria-label="Наверх"
      onClick={scrollToTop}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 5l-6 6h4v8h4v-8h4l-6-6z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
}
