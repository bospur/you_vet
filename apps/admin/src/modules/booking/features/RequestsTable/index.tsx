import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import type { BookingRequest } from '../../../../data/source/booking';
import { REQUEST_STATUS_COLOR, REQUEST_STATUS_LABELS, type BookingRequestStatus } from '../../domain/labels';

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  });
}

interface Props {
  data: BookingRequest[];
  onConfirm: (row: BookingRequest) => void;
  onReject: (row: BookingRequest) => void;
  onCancel: (row: BookingRequest) => void;
  loadingId?: number | null;
}

function Actions({ row, onConfirm, onReject, onCancel, loadingId }: Props & { row: BookingRequest }) {
  const busy = loadingId === row.id;
  if (row.status === 'pending') {
    return (
      <Stack direction="row" spacing={0.5}>
        <Tooltip title="Подтвердить">
          <span>
            <IconButton size="small" color="success" disabled={busy} onClick={() => onConfirm(row)}>
              <CheckIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Отклонить">
          <span>
            <IconButton size="small" color="error" disabled={busy} onClick={() => onReject(row)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    );
  }
  if (row.status === 'confirmed') {
    return (
      <Button size="small" color="inherit" disabled={busy} onClick={() => onCancel(row)}>
        Отменить
      </Button>
    );
  }
  return null;
}

export function RequestsTable({ data, onConfirm, onReject, onCancel, loadingId }: Props) {
  if (data.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        Заявок пока нет
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Дата</TableCell>
            <TableCell>Услуга</TableCell>
            <TableCell>Клиент / питомец</TableCell>
            <TableCell>Телефон</TableCell>
            <TableCell>Статус</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{formatDate(row.requested_date)}</TableCell>
              <TableCell>{row.service_name ?? `#${row.service_type_id}`}</TableCell>
              <TableCell>
                <Typography variant="body2">{row.client_name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {row.pet_name}
                </Typography>
              </TableCell>
              <TableCell>{row.client_phone || '—'}</TableCell>
              <TableCell>
                <Chip
                  label={REQUEST_STATUS_LABELS[row.status as BookingRequestStatus]}
                  size="small"
                  color={REQUEST_STATUS_COLOR[row.status as BookingRequestStatus]}
                  variant="outlined"
                />
                {row.reject_reason && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    {row.reject_reason}
                  </Typography>
                )}
              </TableCell>
              <TableCell align="right">
                <Actions
                  row={row}
                  data={data}
                  onConfirm={onConfirm}
                  onReject={onReject}
                  onCancel={onCancel}
                  loadingId={loadingId}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function RequestsCards({ data, onConfirm, onReject, onCancel, loadingId }: Props) {
  if (data.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        Заявок пока нет
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      {data.map((row) => (
        <Paper key={row.id} variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={600}>{row.service_name ?? `Услуга #${row.service_type_id}`}</Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(row.requested_date)}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {row.client_name} · {row.pet_name}
              </Typography>
              {row.client_phone && (
                <Typography variant="caption" color="text.secondary">
                  {row.client_phone}
                </Typography>
              )}
              {row.reject_reason && (
                <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                  {row.reject_reason}
                </Typography>
              )}
            </Box>
            <Chip
              label={REQUEST_STATUS_LABELS[row.status as BookingRequestStatus]}
              size="small"
              color={REQUEST_STATUS_COLOR[row.status as BookingRequestStatus]}
              variant="outlined"
            />
          </Box>
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Actions
              row={row}
              data={data}
              onConfirm={onConfirm}
              onReject={onReject}
              onCancel={onCancel}
              loadingId={loadingId}
            />
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
