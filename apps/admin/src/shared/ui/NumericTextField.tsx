import TextField, { type TextFieldProps } from '@mui/material/TextField';

type Props = Omit<TextFieldProps, 'type' | 'onChange' | 'value'> & {
  value: number | '' | undefined;
  onValueChange: (value: number | '') => void;
  min?: number;
  max?: number;
  allowEmpty?: boolean;
  /** Дробные значения (цена), до 2 знаков после запятой */
  decimal?: boolean;
};

/** Число без стрелок счётчика; пустое поле не сбрасывается в 0. */
export function NumericTextField({
  value,
  onValueChange,
  min,
  max,
  allowEmpty = true,
  decimal = false,
  ...rest
}: Props) {
  const display = value === undefined || value === '' ? '' : String(value);

  return (
    <TextField
      {...rest}
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      value={display}
      onChange={(e) => {
        const raw = e.target.value.replace(',', '.');
        if (raw === '') {
          onValueChange(allowEmpty ? '' : (min ?? 0));
          return;
        }
        const pattern = decimal ? /^\d*(\.\d{0,2})?$/ : /^\d+$/;
        if (!pattern.test(raw)) return;
        if (raw === '.' || raw.endsWith('.')) return;
        let n = Number(raw);
        if (Number.isNaN(n)) return;
        if (min !== undefined && n < min) n = min;
        if (max !== undefined && n > max) n = max;
        onValueChange(n);
      }}
      slotProps={{
        htmlInput: { className: 'yv-no-spin' },
      }}
    />
  );
}
