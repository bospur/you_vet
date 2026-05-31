import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Layout } from '../../shared/ui/Layout';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { useNotification } from '../../shared/ui/Notification/NotificationContext';
import {
  getBookingServiceTypes,
  createBookingServiceType,
  updateBookingServiceType,
  deleteBookingServiceType,
  type BookingServiceType,
  type BookingServiceTypeInput,
} from '../../data/source/booking';
import { ServiceTypesTable, ServiceTypesCards } from '../../modules/booking/features/ServiceTypesTable';
import { ServiceTypeFormDialog } from '../../modules/booking/features/ServiceTypeFormDialog';

export function BookingServicesScreen() {
  const { notify } = useNotification();
  const qc = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [dialog, setDialog] = useState<{ open: boolean; item: BookingServiceType | null }>({
    open: false,
    item: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<BookingServiceType | null>(null);

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['booking-service-types'],
    queryFn: getBookingServiceTypes,
  });

  const createMutation = useMutation({
    mutationFn: createBookingServiceType,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking-service-types'] });
      setDialog({ open: false, item: null });
      notify('Услуга создана', 'success');
    },
    onError: () => notify('Ошибка создания', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: BookingServiceTypeInput }) =>
      updateBookingServiceType(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking-service-types'] });
      setDialog({ open: false, item: null });
      notify('Сохранено', 'success');
    },
    onError: () => notify('Ошибка сохранения', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBookingServiceType,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking-service-types'] });
      setDeleteTarget(null);
      notify('Удалено', 'success');
    },
    onError: () => notify('Ошибка удаления', 'error'),
  });

  const formLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (input: BookingServiceTypeInput) => {
    if (dialog.item) {
      updateMutation.mutate({ id: dialog.item.id, input });
    } else {
      createMutation.mutate(input);
    }
  };

  return (
    <Layout title="Запись — Услуги">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={600}>Услуги для записи</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Каталог процедур для Mini App. Расписание — в соседнем пункте меню.
          </Typography>
        </Box>
        {isMobile ? (
          <Tooltip title="Добавить">
            <IconButton color="primary" onClick={() => setDialog({ open: true, item: null })}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ open: true, item: null })}>
            Добавить
          </Button>
        )}
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Typography color="error">Не удалось загрузить услуги. Проверьте, что сервер обновлён (миграция 013).</Typography>
      )}

      {!isLoading && !isError && (
        isMobile
          ? <ServiceTypesCards data={data} onEdit={(item) => setDialog({ open: true, item })} onDelete={setDeleteTarget} />
          : <ServiceTypesTable data={data} onEdit={(item) => setDialog({ open: true, item })} onDelete={setDeleteTarget} />
      )}

      <ServiceTypeFormDialog
        open={dialog.open}
        initial={dialog.item}
        loading={formLoading}
        onClose={() => setDialog({ open: false, item: null })}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Удалить услугу?"
        message={`«${deleteTarget?.name}» будет удалена из каталога.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </Layout>
  );
}
