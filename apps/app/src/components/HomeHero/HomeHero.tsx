import type { ClinicInfo } from '../../api';
import catImg from '../../assets/home/cat.png';
import styles from './HomeHero.module.css';

const DEFAULT_SLOGAN = 'Мы работаем для вас и ваших питомцев!';

interface HomeHeroProps {
  info: ClinicInfo | null;
}

export function HomeHero({ info }: HomeHeroProps) {
  const slogan = info?.description?.trim() || DEFAULT_SLOGAN;

  return (
    <div className={styles.hero}>
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
    </div>
  );
}
