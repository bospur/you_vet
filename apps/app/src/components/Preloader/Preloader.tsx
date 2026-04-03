import styles from './Preloader.module.css';

export function Preloader() {
  return (
    <div className={styles.container}>
      <div className={styles.scene}>
        <div className={styles.cat}>
          <div className={styles.ears}>
            <div className={styles.ear} />
            <div className={styles.ear} />
          </div>
          <div className={styles.head}>
            <div className={styles.eyes}>
              <div className={styles.eye} />
              <div className={styles.eye} />
            </div>
            <div className={styles.nose} />
          </div>
          <div className={styles.body}>
            <div className={styles.tail} />
          </div>
          <div className={styles.legs}>
            <div className={styles.leg} />
            <div className={styles.leg} />
            <div className={styles.leg} />
            <div className={styles.leg} />
          </div>
        </div>
      </div>

      <div className={styles.paws}>
        <span className={styles.paw}>🐾</span>
        <span className={styles.paw}>🐾</span>
        <span className={styles.paw}>🐾</span>
      </div>

      <span className={styles.text}>Загружаем...</span>
    </div>
  );
}
