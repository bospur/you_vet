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
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Layout } from '../../shared/ui/Layout';
import { useNotification } from '../../shared/ui/Notification/NotificationContext';
import {
  getBookingRequests,
  getBookingServiceTypes,
  updateBookingRequest,
  type BookingRequest,
} from '../../data/source/booking';
import { RequestsCards, RequestsTable } from '../../modules/booking/features/RequestsTable';

const STATUS_TABS = [
  { value: '', label: 'Все' },
  { value: 'pending', label: 'Ожидают' },
  { value: 'confirmed', label: 'Подтверждены' },
  { value: 'rejected', label: 'Отклонены' },
  { value: 'cancelled', label: 'Отменены' },
] as const;

export function BookingRequestsScreen() {
  const { notify } = useNotification();
  const qc = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

  const handleConfirm = (row: BookingRequest) => {
    setActionId(row.id);
    patchMutation.mutate({ id: row.id, patch: { status: 'confirmed' } });
  };

  const handleCancel = (row: BookingRequest) => {
    setActionId(row.id);
    patchMutation.mutate({ id: row.id, patch: { status: 'cancelled' } });
  };

  const handleRejectSubmit = () => {
    if (!rejectTarget) return;
    setActionId(rejectTarget.id);
    patchMutation.mutate({
      id: rejectTarget.id,
      patch: { status: 'rejected', reject_reason: rejectReason.trim() || 'Отклонено клиникой' },
    });
  };

  return (
    <Layout title="Запись · заявки">
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={700}>
          Заявки на запись
        </Typography>

        <Tabs
          value={statusFilter}
          onChange={(_, v) => setStatusFilter(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {STATUS_TABS.map((t) => (
            <Tab key={t.value || 'all'} label={t.label} value={t.value} />
          ))}
        </Tabs>

        <TextField
          select
          label="Услуга"
          size="small"
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value === '' ? '' : Number(e.target.value))}
          sx={{ maxWidth: isMobile ? '100%' : 320 }}
          fullWidth={isMobile}
        >
          <MenuItem value="">Все услуги</MenuItem>
          {services.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {isError && (
          <Typography color="error">Не удалось загрузить заявки</Typography>
        )}

        {!isLoading && !isError && (
          isMobile ? (
            <RequestsCards
              data={requests}
              onConfirm={handleConfirm}
              onReject={setRejectTarget}
              onCancel={handleCancel}
              loadingId={actionId}
            />
          ) : (
            <RequestsTable
              data={requests}
              onConfirm={handleConfirm}
              onReject={setRejectTarget}
              onCancel={handleCancel}
              loadingId={actionId}
            />
          )
        )}
      </Stack>

      <Dialog
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        fullScreen={isMobile}
        fullWidth
        maxWidth="sm"
      >
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
            onClick={handleRejectSubmit}
            disabled={patchMutation.isPending}
          >
            Отклонить
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
