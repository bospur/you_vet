import styles from './StickyCallBar.module.css';

interface StickyCallBarProps {
  phone: string;
  phoneDisplay: string;
}

export function StickyCallBar({ phone, phoneDisplay }: StickyCallBarProps) {
  const tel = phone.replace(/\s/g, '');

  return (
    <a href={`tel:${tel}`} className={styles.bar}>
      Позвонить: {phoneDisplay}
    </a>
  );
}
