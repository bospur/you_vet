import css from './CatPreloader.module.css';

interface Props {
  text?: string;
}

export function CatPreloader({ text = 'Загружаем...' }: Props) {
  return (
    <div className={css.container}>
      <div className={css.scene}>
        <div className={css.cat}>
          <div className={css.ears}>
            <div className={css.ear} />
            <div className={css.ear} />
          </div>
          <div className={css.head}>
            <div className={css.eyes}>
              <div className={css.eye} />
              <div className={css.eye} />
            </div>
            <div className={css.nose} />
          </div>
          <div className={css.body}>
            <div className={css.tail} />
          </div>
          <div className={css.legs}>
            <div className={css.leg} />
            <div className={css.leg} />
            <div className={css.leg} />
            <div className={css.leg} />
          </div>
        </div>
      </div>
      <div className={css.paws}>
        <span className={css.paw}>🐾</span>
        <span className={css.paw}>🐾</span>
        <span className={css.paw}>🐾</span>
      </div>
      {text && <span className={css.text}>{text}</span>}
    </div>
  );
}
