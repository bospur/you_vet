import { useState } from 'react';
import type { ClinicInfo } from '@you-vet/types';
import styles from './HomeClinicBlock.module.css';

const EXPANDED_KEY = 'home_clinic_expanded_v1';

function normalizeWebsiteUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

interface HomeClinicBlockProps {
  clinic: ClinicInfo | null;
}

export function HomeClinicBlock({ clinic }: HomeClinicBlockProps) {
  const [expanded, setExpanded] = useState(
    () => sessionStorage.getItem(EXPANDED_KEY) === '1',
  );

  const description = clinic?.description?.trim();
  const address = clinic?.address?.trim();
  const email = clinic?.email?.trim();
  const website = clinic?.website?.trim();
  const phone = clinic?.phone?.replace(/\s/g, '');
  const hasDetails = Boolean(description || phone || email || website);

  const toggle = () => {
    setExpanded((open) => {
      const next = !open;
      sessionStorage.setItem(EXPANDED_KEY, next ? '1' : '0');
      return next;
    });
  };

  return (
    <section className={styles.hero}>
      <h2 className={styles.title}>{clinic?.name ?? 'Ветпрактика'}</h2>
      {address && <p className={styles.address}>{address}</p>}

      {hasDetails && (
        <>
          <button
            type="button"
            className={styles.toggle}
            onClick={toggle}
            aria-expanded={expanded}
            aria-controls="home-clinic-details"
          >
            <span>{expanded ? 'Свернуть' : 'Подробнее'}</span>
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
            id="home-clinic-details"
            className={`${styles.panel} ${expanded ? styles.panelOpen : ''}`}
          >
            <div className={styles.panelInner}>
              {description && <p className={styles.description}>{description}</p>}
              {(phone || email || website) && (
                <div className={styles.contacts}>
                  {phone && (
                    <a href={`tel:${phone}`} className={styles.phoneLink}>
                      📞 {clinic?.phone?.trim()}
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
            </div>
          </div>
        </>
      )}
    </section>
  );
}
