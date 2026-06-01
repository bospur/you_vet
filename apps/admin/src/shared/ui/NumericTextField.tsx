import TextField, { type TextFieldProps } from '@mui/material/TextField';

type Props = Omit<TextFieldProps, 'type' | 'onChange' | 'value'> & {
  value: number | '' | undefined;
  onValueChange: (value: number | '') => void;
  min?: number;
  max?: number;
  allowEmpty?: boolean;
};

/** Число без стрелок счётчика; пустое поле не сбрасывается в 0. */
export function NumericTextField({
  value,
  onValueChange,
  min,
  max,
  allowEmpty = true,
  ...rest
}: Props) {
  const display = value === undefined || value === '' ? '' : String(value);

  return (
    <TextField
      {...rest}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={(e) => {
        const raw = e.target.value.trim();
        if (raw === '') {
          onValueChange(allowEmpty ? '' : (min ?? 0));
          return;
        }
        if (!/^\d+$/.test(raw)) return;
        let n = Number(raw);
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
