import type { SxProps, Theme } from '@mui/material';

export const styles = {
  paper: {
    overflow: 'hidden',
    borderRadius: 2,
    width: '100%',
  } satisfies SxProps<Theme>,

  iconCell: {
    fontSize: '1.5rem',
    lineHeight: 1,
  } satisfies SxProps<Theme>,

  actionsCell: {
    display: 'flex',
    gap: 0.5,
    justifyContent: 'flex-end',
  } satisfies SxProps<Theme>,

  // Mobile cards
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1.5,
    width: '100%',
  } satisfies SxProps<Theme>,

  card: {
    p: 2,
    borderRadius: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  } satisfies SxProps<Theme>,

  cardIcon: {
    fontSize: '2rem',
    lineHeight: 1,
    flexShrink: 0,
  } satisfies SxProps<Theme>,

  cardContent: {
    flexGrow: 1,
    minWidth: 0,
  } satisfies SxProps<Theme>,

  cardActions: {
    display: 'flex',
    gap: 0.5,
    flexShrink: 0,
  } satisfies SxProps<Theme>,
};
