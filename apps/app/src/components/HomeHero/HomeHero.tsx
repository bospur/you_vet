import type { ClinicInfo } from '../../api';
import catImg from '../../assets/home/cat.png';
import styles from './HomeHero.module.css';

const DEFAULT_SLOGAN = 'Мы работаем для вас и ваших питомцев!';

interface HomeHeroProps {
  info: ClinicInfo | null;
}

export function HomeHero({ info }: HomeHeroProps) {
  const phone = info?.phone?.replace(/\s/g, '');
  const slogan = info?.description?.trim() || DEFAULT_SLOGAN;

  return (
    <header className={styles.hero}>
      <div className={styles.topRow}>
        <h1 className={styles.title}>{info?.name || 'ВЕТПРАКТИКА'}</h1>
        {phone && (
          <a href={`tel:${phone}`} className={styles.phoneBtn} aria-label="Позвонить">
            <svg width="40" height="42" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C9.6 21 3 14.4 3 6c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"
                fill="currentColor"
              />
            </svg>
          </a>
        )}
      </div>

      {info?.address && (
        <p className={styles.address}>
          <svg width="11" height="15" viewBox="0 0 11 15" fill="none" aria-hidden className={styles.pin}>
            <path
              d="M5.5 0C2.46 0 0 2.46 0 5.5c0 4.125 5.5 9.5 5.5 9.5S11 9.625 11 5.5C11 2.46 8.54 0 5.5 0zm0 7.5a2 2 0 110-4 2 2 0 010 4z"
              fill="currentColor"
            />
          </svg>
          {info.address}
        </p>
      )}

      <div className={styles.sloganRow}>
        <img src={catImg} alt="" className={styles.cat} />
        <p className={styles.slogan}>{slogan}</p>
      </div>
    </header>
  );
}
