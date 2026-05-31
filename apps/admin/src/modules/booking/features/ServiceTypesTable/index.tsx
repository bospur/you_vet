import {
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Typography,
  Box,
  Stack,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { BookingServiceType } from '../../../../data/source/booking';
import { BOOKING_MODE_LABELS, CATEGORY_LABELS, SPECIES_LABELS } from '../../domain/labels';

interface Props {
  data: BookingServiceType[];
  onEdit: (row: BookingServiceType) => void;
  onDelete: (row: BookingServiceType) => void;
}

export function ServiceTypesTable({ data, onEdit, onDelete }: Props) {
  if (data.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        Нет услуг. Добавьте первую или дождитесь загрузки каталога после обновления сервера.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Название</TableCell>
            <TableCell>Категория</TableCell>
            <TableCell>Животные</TableCell>
            <TableCell>Мин</TableCell>
            <TableCell>Режим</TableCell>
            <TableCell>Статус</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id} sx={{ opacity: row.is_active ? 1 : 0.55 }}>
              <TableCell>
                <Typography fontWeight={500}>{row.name}</Typography>
                {row.capacity_group && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Общий лимит: {row.capacity_group}
                  </Typography>
                )}
              </TableCell>
              <TableCell>{CATEGORY_LABELS[row.category]}</TableCell>
              <TableCell>{SPECIES_LABELS[row.species_filter]}</TableCell>
              <TableCell>{row.default_duration_min}</TableCell>
              <TableCell>
                <Typography variant="body2">{BOOKING_MODE_LABELS[row.booking_mode]}</Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={row.is_active ? 'Активна' : 'Скрыта'}
                  size="small"
                  color={row.is_active ? 'success' : 'default'}
                  variant="outlined"
                />
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" justifyContent="flex-end">
                  <Tooltip title="Редактировать">
                    <IconButton size="small" onClick={() => onEdit(row)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Удалить">
                    <IconButton size="small" color="error" onClick={() => onDelete(row)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function ServiceTypesCards({ data, onEdit, onDelete }: Props) {
  return (
    <Stack spacing={1.5}>
      {data.map((row) => (
        <Paper key={row.id} variant="outlined" sx={{ p: 2, opacity: row.is_active ? 1 : 0.55 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography fontWeight={600}>{row.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {CATEGORY_LABELS[row.category]} · {SPECIES_LABELS[row.species_filter]} · {row.default_duration_min} мин
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {BOOKING_MODE_LABELS[row.booking_mode]}
              </Typography>
            </Box>
            <Stack direction="row">
              <IconButton size="small" onClick={() => onEdit(row)}><EditIcon /></IconButton>
              <IconButton size="small" color="error" onClick={() => onDelete(row)}><DeleteIcon /></IconButton>
            </Stack>
          </Box>
        </Paper>
      ))}
    </Stack>
  );
}
