import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useNotification } from '../../../../shared/ui/Notification/NotificationContext';
import {
  getBookingRequests,
  getBookingServiceTypes,
  updateBookingRequest,
  type BookingRequest,
} from '../../../../data/source/booking';
import { RequestsCards, RequestsTable } from '../RequestsTable';

const STATUS_TABS = [
  { value: '', label: 'Все' },
  { value: 'pending', label: 'Ожидают' },
  { value: 'confirmed', label: 'Подтверждены' },
  { value: 'rejected', label: 'Отклонены' },
  { value: 'cancelled', label: 'Отменены' },
] as const;

export function BookingRequestsPanel() {
  const { notify } = useNotification();
  const qc = useQueryClient();
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));

  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState<number | ''>('');
  const [rejectTarget, setRejectTarget] = useState<BookingRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionId, setActionId] = useState<number | null>(null);

  const serviceTypeId = typeof serviceFilter === 'number' ? serviceFilter : undefined;

  const { data: services = [] } = useQuery({
    queryKey: ['booking-service-types'],
    queryFn: getBookingServiceTypes,
  });

  const { data: requests = [], isLoading, isError } = useQuery({
    queryKey: ['booking-requests', statusFilter, serviceTypeId],
    queryFn: () =>
      getBookingRequests({ status: statusFilter || undefined, service_type_id: serviceTypeId }),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Parameters<typeof updateBookingRequest>[1] }) =>
      updateBookingRequest(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking-requests'] });
      qc.invalidateQueries({ queryKey: ['booking-availability'] });
      setRejectTarget(null);
      setRejectReason('');
      setActionId(null);
      notify('Сохранено', 'success');
    },
    onError: () => {
      setActionId(null);
      notify('Ошибка операции', 'error');
    },
  });

  return (
    <>
      <Tabs
        value={statusFilter}
        onChange={(_, v) => setStatusFilter(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        {STATUS_TABS.map((t) => (
          <Tab key={t.value || 'all'} label={t.label} value={t.value} />
        ))}
      </Tabs>

      <Box sx={{ mb: 2, width: '100%', maxWidth: 400 }}>
        <FormControl fullWidth size="small" variant="outlined">
          <InputLabel id="booking-requests-service-filter">Услуга</InputLabel>
          <Select<string>
            labelId="booking-requests-service-filter"
            id="booking-requests-service-select"
            label="Услуга"
            value={serviceFilter === '' ? '' : String(serviceFilter)}
            onChange={(e) => {
              const v = e.target.value;
              setServiceFilter(v === '' ? '' : Number(v));
            }}
            MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
          >
            <MenuItem value="">Все услуги</MenuItem>
            {services.map((s) => (
              <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      )}

      {isError && <Typography color="error">Не удалось загрузить заявки</Typography>}

      {!isLoading && !isError && (
        isMobile ? (
          <RequestsCards
            data={requests}
            onConfirm={(row) => { setActionId(row.id); patchMutation.mutate({ id: row.id, patch: { status: 'confirmed' } }); }}
            onReject={setRejectTarget}
            onCancel={(row) => { setActionId(row.id); patchMutation.mutate({ id: row.id, patch: { status: 'cancelled' } }); }}
            loadingId={actionId}
          />
        ) : (
          <RequestsTable
            data={requests}
            onConfirm={(row) => { setActionId(row.id); patchMutation.mutate({ id: row.id, patch: { status: 'confirmed' } }); }}
            onReject={setRejectTarget}
            onCancel={(row) => { setActionId(row.id); patchMutation.mutate({ id: row.id, patch: { status: 'cancelled' } }); }}
            loadingId={actionId}
          />
        )
      )}

      <Dialog open={!!rejectTarget} onClose={() => setRejectTarget(null)} fullScreen={isMobile} fullWidth maxWidth="sm">
        <DialogTitle>Отклонить заявку</DialogTitle>
        <DialogContent>
          <TextField
            label="Причина (увидит клиент)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            multiline
            minRows={2}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectTarget(null)}>Отмена</Button>
          <Button
            color="error"
            variant="contained"
            disabled={patchMutation.isPending || !rejectTarget}
            onClick={() => rejectTarget && patchMutation.mutate({
              id: rejectTarget.id,
              patch: { status: 'rejected', reject_reason: rejectReason.trim() || 'Отклонено клиникой' },
            })}
          >
            Отклонить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
