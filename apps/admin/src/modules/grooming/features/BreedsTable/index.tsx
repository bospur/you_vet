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
import type { GroomingBreedGroup } from '../../domain/types';
import { formatPriceRange } from '../../domain/formatPrice';

interface Props {
  data: GroomingBreedGroup[];
  onEdit: (group: GroomingBreedGroup) => void;
  onDelete: (group: GroomingBreedGroup) => void;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

function ServiceChips({ group }: { group: GroomingBreedGroup }) {
  return (
    <Stack spacing={0.75}>
      {group.services.map((s) => (
        <Stack key={s.id} direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {group.services.length > 1 && (
            <Chip label={s.service_name} size="small" variant="outlined" />
          )}
          <Chip label={formatDuration(s.duration)} size="small" color="primary" variant="outlined" />
          <Chip label={formatPriceRange(s.price_from, s.price_to)} size="small" />
        </Stack>
      ))}
    </Stack>
  );
}

export function BreedsTable({ data, onEdit, onDelete }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isMobile) {
    return (
      <Stack spacing={1.5}>
        {data.map((group) => (
          <Card key={group.breed} variant="outlined">
            <CardContent sx={{ pb: '12px !important' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={600}>{group.breed}</Typography>
                  <Box mt={1}>
                    <ServiceChips group={group} />
                  </Box>
                  {group.description && (
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      {group.description}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row">
                  <Tooltip title="Редактировать">
                    <IconButton size="small" onClick={() => onEdit(group)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Удалить">
                    <IconButton size="small" color="error" onClick={() => onDelete(group)}>
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
          <TableCell><strong>Услуги</strong></TableCell>
          <TableCell><strong>Описание</strong></TableCell>
          <TableCell align="right" />
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((group) => (
          <TableRow key={group.breed} hover>
            <TableCell><Typography fontWeight={500}>{group.breed}</Typography></TableCell>
            <TableCell>
              <ServiceChips group={group} />
            </TableCell>
            <TableCell sx={{ maxWidth: 280, color: 'text.secondary', fontSize: 13 }}>
              {group.description ?? '—'}
            </TableCell>
            <TableCell align="right">
              <Tooltip title="Редактировать">
                <IconButton size="small" onClick={() => onEdit(group)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Удалить">
                <IconButton size="small" color="error" onClick={() => onDelete(group)}>
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
