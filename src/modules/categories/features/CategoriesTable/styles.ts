import type { SxProps, Theme } from '@mui/material';

export const styles = {
  accordion: {
    mb: 1,
    borderRadius: '8px !important',
    '&:before': { display: 'none' },
    boxShadow: '0px 1px 4px rgba(0,0,0,0.08)',
  } satisfies SxProps<Theme>,

  accordionSummary: {
    '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1.5 },
  } satisfies SxProps<Theme>,

  animalIcon: { fontSize: '1.75rem', lineHeight: 1 } satisfies SxProps<Theme>,

  badge: { ml: 'auto' } satisfies SxProps<Theme>,

  // Таблица внутри
  iconCell: { fontSize: '1.25rem', lineHeight: 1 } satisfies SxProps<Theme>,
  actionsCell: { display: 'flex', gap: 0.5, justifyContent: 'flex-end' } satisfies SxProps<Theme>,

  // Карточки (мобиль)
  cardList: { display: 'flex', flexDirection: 'column', gap: 1, p: 1 } satisfies SxProps<Theme>,
  card: { p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5 } satisfies SxProps<Theme>,
  cardIcon: { fontSize: '1.5rem', lineHeight: 1, flexShrink: 0 } satisfies SxProps<Theme>,
  cardContent: { flexGrow: 1, minWidth: 0 } satisfies SxProps<Theme>,
  cardActions: { display: 'flex', gap: 0.5, flexShrink: 0 } satisfies SxProps<Theme>,

  empty: { py: 2, px: 3, color: 'text.secondary', fontStyle: 'italic' } satisfies SxProps<Theme>,
};
