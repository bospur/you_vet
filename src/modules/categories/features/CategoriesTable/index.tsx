import {
  Accordion, AccordionDetails, AccordionSummary,
  Box, Chip, IconButton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tooltip, Typography,
  useMediaQuery, useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Animal } from '../../../animals/domain/types';
import type { CategoryRow } from '../../domain/types';
import { useCategoriesTableLogic } from './useLogic';
import { styles } from './styles';

interface CategoriesTableProps {
  animals: Animal[];
  data: CategoryRow[];
  onEdit: (category: CategoryRow) => void;
  onDelete: (category: CategoryRow) => void;
}

export function CategoriesTable({ animals, data, onEdit, onDelete }: CategoriesTableProps) {
  const { grouped, expanded, toggle } = useCategoriesTableLogic({ animals, data });
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));

  if (animals.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        Сначала добавьте животных
      </Typography>
    );
  }

  return (
    <Box>
      {grouped.map(({ animal, categories }) => (
        <Accordion
          key={animal.id}
          expanded={expanded === animal.id}
          onChange={() => toggle(animal.id)}
          sx={styles.accordion}
          disableGutters
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={styles.accordionSummary}>
            <Box sx={styles.animalIcon}>{animal.icon || '🐾'}</Box>
            <Typography fontWeight={600}>{animal.name}</Typography>
            <Chip
              label={categories.length}
              size="small"
              color={categories.length > 0 ? 'primary' : 'default'}
              sx={styles.badge}
            />
          </AccordionSummary>

          <AccordionDetails sx={{ p: 0 }}>
            {categories.length === 0 ? (
              <Typography sx={styles.empty}>Нет категорий — нажмите «Добавить»</Typography>
            ) : isMobile ? (
              /* Мобиль — карточки */
              <Box sx={styles.cardList}>
                {categories.map((cat) => (
                  <Box key={cat.id} sx={styles.card}>
                    <Box sx={styles.cardIcon}>{cat.icon || '📁'}</Box>
                    <Box sx={styles.cardContent}>
                      <Typography fontWeight={600} noWrap>{cat.name}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>{cat.slug}</Typography>
                    </Box>
                    <Box sx={styles.cardActions}>
                      <Tooltip title="Редактировать">
                        <IconButton size="small" onClick={() => onEdit(cat)}><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Удалить">
                        <IconButton size="small" color="error" onClick={() => onDelete(cat)}><DeleteIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              /* Десктоп — таблица */
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {['№', 'Иконка', 'Название', 'Slug', ''].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categories.map((cat) => (
                      <TableRow key={cat.id} hover>
                        <TableCell width={60}>{cat.sort_order}</TableCell>
                        <TableCell width={70}>
                          <Box sx={styles.iconCell}>{cat.icon || '—'}</Box>
                        </TableCell>
                        <TableCell>{cat.name}</TableCell>
                        <TableCell>{cat.slug}</TableCell>
                        <TableCell width={100}>
                          <Box sx={styles.actionsCell}>
                            <Tooltip title="Редактировать">
                              <IconButton size="small" onClick={() => onEdit(cat)}><EditIcon fontSize="small" /></IconButton>
                            </Tooltip>
                            <Tooltip title="Удалить">
                              <IconButton size="small" color="error" onClick={() => onDelete(cat)}><DeleteIcon fontSize="small" /></IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
