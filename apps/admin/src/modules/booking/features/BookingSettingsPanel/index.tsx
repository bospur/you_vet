import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { useNotification } from '../../../../shared/ui/Notification/NotificationContext';
import {
  clearBookingStaffChat,
  getBookingSettings,
  linkBookingStaffChat,
  updateBookingStaffChat,
} from '../../../../data/source/booking';

export function BookingSettingsPanel() {
  const { notify } = useNotification();
  const qc = useQueryClient();
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const [manualChatId, setManualChatId] = useState('');

  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['booking-settings'],
    queryFn: getBookingSettings,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['booking-settings'] });

  const linkMutation = useMutation({
    mutationFn: (chatId?: number) => linkBookingStaffChat(chatId),
    onSuccess: (data) => {
      invalidate();
      if ('instruction' in data) notify('Обновите статус после /link_staff в чате', 'info');
      else {
        notify('Чат привязан', 'success');
        setManualChatId('');
      }
    },
    onError: () => notify('Ошибка привязки', 'error'),
  });

  const manualMutation = useMutation({
    mutationFn: (chatId: number) => updateBookingStaffChat(chatId),
    onSuccess: () => { invalidate(); notify('Chat ID сохранён', 'success'); },
    onError: () => notify('Ошибка сохранения', 'error'),
  });

  const clearMutation = useMutation({
    mutationFn: clearBookingStaffChat,
    onSuccess: () => { invalidate(); notify('Привязка снята', 'info'); },
    onError: () => notify('Ошибка', 'error'),
  });

  const linked = settings?.staff_chat_id != null;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
    );
  }

  if (isError) return <Alert severity="error">Не удалось загрузить настройки</Alert>;

  return (
    <Paper variant="outlined" sx={{ p: isMobile ? 2 : 3, maxWidth: 640 }}>
      <Stack spacing={2}>
        <Typography variant="subtitle1" fontWeight={600}>
          Чат врачей для уведомлений
        </Typography>

        {linked ? (
          <Alert severity="success" icon={<CheckCircleIcon />}>
            Чат привязан · ID: <code>{settings?.staff_chat_id}</code>
          </Alert>
        ) : (
          <Alert severity="warning">Чат не привязан — уведомления не отправляются</Alert>
        )}

        <Typography variant="body2" color="text.secondary">
          Добавьте @VPract_bot в групповой чат или канал (с правом публиковать) и отправьте:
        </Typography>
        <Paper variant="outlined" sx={{ px: 2, py: 1, bgcolor: 'action.hover', fontFamily: 'monospace' }}>
          /link_staff
        </Paper>

        <Stack direction={isMobile ? 'column' : 'row'} spacing={1}>
          <Button variant="outlined" onClick={() => linkMutation.mutate(undefined)} disabled={linkMutation.isPending}>
            Обновить статус
          </Button>
          {linked && (
            <Button color="inherit" startIcon={<LinkOffIcon />} onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending}>
              Отвязать
            </Button>
          )}
        </Stack>

        <Typography variant="subtitle2">Или Chat ID вручную</Typography>
        <Stack direction={isMobile ? 'column' : 'row'} spacing={1}>
          <TextField
            size="small"
            label="Chat ID"
            placeholder="-1001234567890"
            value={manualChatId}
            onChange={(e) => setManualChatId(e.target.value)}
            fullWidth
          />
          <Button
            variant="contained"
            disabled={manualMutation.isPending || !manualChatId.trim()}
            onClick={() => {
              const id = Number(manualChatId.trim());
              if (!Number.isFinite(id)) { notify('Некорректный Chat ID', 'error'); return; }
              manualMutation.mutate(id);
            }}
          >
            Сохранить
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
