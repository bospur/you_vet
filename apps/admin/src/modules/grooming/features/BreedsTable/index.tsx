import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { GroomingBreed } from '../../domain/types';

interface Props {
  data: GroomingBreed[];
  onEdit: (breed: GroomingBreed) => void;
  onDelete: (breed: GroomingBreed) => void;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

export function BreedsTable({ data, onEdit, onDelete }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isMobile) {
    return (
      <Stack spacing={1.5}>
        {data.map((breed) => (
          <Card key={breed.id} variant="outlined">
            <CardContent sx={{ pb: '12px !important' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography fontWeight={600}>{breed.breed}</Typography>
                  <Stack direction="row" spacing={1} mt={0.5} flexWrap="wrap" useFlexGap>
                    <Chip label={formatDuration(breed.duration)} size="small" color="primary" variant="outlined" />
                    {breed.price != null && (
                      <Chip label={`${breed.price} ₽`} size="small" />
                    )}
                  </Stack>
                  {breed.description && (
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      {breed.description}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row">
                  <Tooltip title="Редактировать">
                    <IconButton size="small" onClick={() => onEdit(breed)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Удалить">
                    <IconButton size="small" color="error" onClick={() => onDelete(breed)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell><strong>Порода</strong></TableCell>
          <TableCell><strong>Время стрижки</strong></TableCell>
          <TableCell><strong>Стоимость</strong></TableCell>
          <TableCell><strong>Описание</strong></TableCell>
          <TableCell align="right" />
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((breed) => (
          <TableRow key={breed.id} hover>
            <TableCell><Typography fontWeight={500}>{breed.breed}</Typography></TableCell>
            <TableCell>
              <Chip label={formatDuration(breed.duration)} size="small" color="primary" variant="outlined" />
            </TableCell>
            <TableCell>{breed.price != null ? `${breed.price} ₽` : '—'}</TableCell>
            <TableCell sx={{ maxWidth: 300, color: 'text.secondary', fontSize: 13 }}>
              {breed.description ?? '—'}
            </TableCell>
            <TableCell align="right">
              <Tooltip title="Редактировать">
                <IconButton size="small" onClick={() => onEdit(breed)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Удалить">
                <IconButton size="small" color="error" onClick={() => onDelete(breed)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
