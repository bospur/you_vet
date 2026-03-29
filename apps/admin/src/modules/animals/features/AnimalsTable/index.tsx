import { flexRender } from '@tanstack/react-table';
import {
  Box,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Animal } from '../../domain/types';
import { useAnimalsTableLogic } from './useLogic';
import { styles } from './styles';

interface AnimalsTableProps {
  data: Animal[];
  onEdit: (animal: Animal) => void;
  onDelete: (animal: Animal) => void;
}

export function AnimalsTable({ data, onEdit, onDelete }: AnimalsTableProps) {
  const { table } = useAnimalsTableLogic({ data, onEdit, onDelete });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (data.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        Животные не добавлены
      </Typography>
    );
  }

  // Мобиль — карточки
  if (isMobile) {
    return (
      <Box sx={styles.cardList}>
        {table.getRowModel().rows.map((row) => {
          const animal = row.original;
          return (
            <Paper key={animal.id} sx={styles.card}>
              <Box sx={styles.cardIcon}>{animal.icon || '🐾'}</Box>
              <Box sx={styles.cardContent}>
                <Typography fontWeight={600} noWrap>{animal.name}</Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {animal.slug}
                </Typography>
              </Box>
              <Box sx={styles.cardActions}>
                <Tooltip title="Редактировать">
                  <IconButton size="small" onClick={() => onEdit(animal)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Удалить">
                  <IconButton size="small" color="error" onClick={() => onDelete(animal)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          );
        })}
      </Box>
    );
  }

  // Десктоп — таблица
  return (
    <Paper sx={styles.paper}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableCell
                    key={header.id}
                    width={header.getSize()}
                    sx={{ fontWeight: 600, bgcolor: 'grey.50' }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const animal = row.original;
              return (
                <TableRow key={row.id} hover>
                  {row.getVisibleCells().map((cell) => {
                    if (cell.column.id === 'icon') {
                      return (
                        <TableCell key={cell.id}>
                          <Box sx={styles.iconCell}>{animal.icon || '—'}</Box>
                        </TableCell>
                      );
                    }
                    if (cell.column.id === 'actions') {
                      return (
                        <TableCell key={cell.id}>
                          <Box sx={styles.actionsCell}>
                            <Tooltip title="Редактировать">
                              <IconButton size="small" onClick={() => onEdit(animal)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Удалить">
                              <IconButton size="small" color="error" onClick={() => onDelete(animal)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      );
                    }
                    return (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
