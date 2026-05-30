import { useState } from 'react';
import type { ClinicInfo } from '../../api';
import catImg from '../../assets/home/cat.png';
import styles from './HomeHero.module.css';

const DEFAULT_SLOGAN = 'Мы работаем для вас и ваших питомцев!';
const ABOUT_EXPANDED_KEY = 'about_expanded_v1';

function normalizeWebsiteUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

interface HomeHeroProps {
  info: ClinicInfo | null;
}

export function HomeHero({ info }: HomeHeroProps) {
  const [expanded, setExpanded] = useState(
    () => sessionStorage.getItem(ABOUT_EXPANDED_KEY) === '1',
  );
  const slogan = info?.description?.trim() || DEFAULT_SLOGAN;
  const address = info?.address?.trim();
  const email = info?.email?.trim();
  const website = info?.website?.trim();
  const phone = info?.phone?.replace(/\s/g, '');
  const hasContacts = Boolean(address || email || website || phone);

  const toggleExpanded = () => {
    setExpanded((open) => {
      const next = !open;
      sessionStorage.setItem(ABOUT_EXPANDED_KEY, next ? '1' : '0');
      return next;
    });
  };

  return (
    <section className={styles.hero}>
      <button
        type="button"
        className={styles.toggle}
        onClick={toggleExpanded}
        aria-expanded={expanded}
        aria-controls="home-about-panel"
      >
        <span>{expanded ? 'Свернуть' : 'О нас'}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
          className={`${styles.chevron} ${expanded ? styles.chevronUp : ''}`}
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        id="home-about-panel"
        className={`${styles.panel} ${expanded ? styles.panelOpen : ''}`}
      >
        <div className={styles.panelInner}>
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
              {phone && (
                <a href={`tel:${phone}`} className={styles.phoneLink}>
                  Позвонить: {info?.phone?.trim()}
                </a>
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
      </div>
    </section>
  );
}
