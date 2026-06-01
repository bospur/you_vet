import type { SxProps, Theme } from '@mui/material';

export const styles = {
  card: {
    width: '100%',
    maxWidth: 400,
    p: 4,
    borderRadius: 3,
  } satisfies SxProps<Theme>,

  title: {
    mb: 3,
    fontWeight: 700,
    textAlign: 'center',
  } satisfies SxProps<Theme>,

  field: {
    mb: 2,
  } satisfies SxProps<Theme>,

  remember: {
    mb: 1,
    ml: -0.5,
    display: 'block',
    '& .MuiFormControlLabel-label': {
      fontSize: 14,
    },
  } satisfies SxProps<Theme>,

  submitBtn: {
    mt: 1,
    py: 1.5,
  } satisfies SxProps<Theme>,
};
