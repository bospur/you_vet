import type { ClinicInfo } from '../../api';
import catImg from '../../assets/home/cat.png';
import styles from './HomeHero.module.css';

const DEFAULT_SLOGAN = 'Мы работаем для вас и ваших питомцев!';

function normalizeWebsiteUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

interface HomeHeroProps {
  info: ClinicInfo | null;
}

export function HomeHero({ info }: HomeHeroProps) {
  const slogan = info?.description?.trim() || DEFAULT_SLOGAN;
  const address = info?.address?.trim();
  const email = info?.email?.trim();
  const website = info?.website?.trim();
  const hasContacts = Boolean(address || email || website);

  return (
    <div className={styles.hero}>
      {hasContacts && (
        <div className={styles.contacts}>
          {address && (
            <p className={styles.contactLine}>
              <svg width="11" height="15" viewBox="0 0 11 15" fill="none" aria-hidden className={styles.icon}>
                <path
                  d="M5.5 0C2.46 0 0 2.46 0 5.5c0 4.125 5.5 9.5 5.5 9.5S11 9.625 11 5.5C11 2.46 8.54 0 5.5 0zm0 7.5a2 2 0 110-4 2 2 0 010 4z"
                  fill="currentColor"
                />
              </svg>
              {address}
            </p>
          )}
          {website && (
            <a
              href={normalizeWebsiteUrl(website)}
              className={styles.contactLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {website}
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className={styles.contactLink}>
              {email}
            </a>
          )}
        </div>
      )}

      <div className={styles.sloganRow}>
        <img src={catImg} alt="" className={styles.cat} />
        <p className={styles.slogan}>{slogan}</p>
      </div>
    </div>
  );
}
