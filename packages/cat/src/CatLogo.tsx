import css from './CatLogo.module.css';

interface Props {
  size?: number;
}

export function CatLogo({ size = 36 }: Props) {
  const scale = size / 36;
  return (
    <div className={css.wrap} style={{ width: size, height: size }}>
      <div className={css.body} style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
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
        <div className={css.torso}>
          <div className={css.tail} />
        </div>
      </div>
    </div>
  );
}
