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
import { Layout } from '../../shared/ui/Layout';
import { useNotification } from '../../shared/ui/Notification/NotificationContext';
import {
  clearBookingStaffChat,
  getBookingSettings,
  linkBookingStaffChat,
  updateBookingStaffChat,
} from '../../data/source/booking';

export function BookingSettingsScreen() {
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
      if ('instruction' in data) {
        notify('Смотрите инструкцию на экране', 'info');
      } else {
        notify('Чат привязан', 'success');
        setManualChatId('');
      }
    },
    onError: () => notify('Ошибка привязки', 'error'),
  });

  const manualMutation = useMutation({
    mutationFn: (chatId: number) => updateBookingStaffChat(chatId),
    onSuccess: () => {
      invalidate();
      notify('Chat ID сохранён', 'success');
    },
    onError: () => notify('Ошибка сохранения', 'error'),
  });

  const clearMutation = useMutation({
    mutationFn: clearBookingStaffChat,
    onSuccess: () => {
      invalidate();
      notify('Привязка снята', 'info');
    },
    onError: () => notify('Ошибка', 'error'),
  });

  const linked = settings?.staff_chat_id != null;

  return (
    <Layout title="Запись · настройки">
      <Stack spacing={2.5} sx={{ maxWidth: 640 }}>
        <Typography variant="h5" fontWeight={700}>
          Настройки записи
        </Typography>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {isError && <Alert severity="error">Не удалось загрузить настройки</Alert>}

        {settings && (
          <Paper variant="outlined" sx={{ p: isMobile ? 2 : 3 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={600}>
                Чат врачей для уведомлений
              </Typography>

              {linked ? (
                <Alert severity="success" icon={<CheckCircleIcon />}>
                  Чат привязан · ID: <code>{settings.staff_chat_id}</code>
                </Alert>
              ) : (
                <Alert severity="warning">
                  Чат не привязан — уведомления о заявках не отправляются
                </Alert>
              )}

              <Typography variant="body2" color="text.secondary">
                1. Убедитесь, что бот <strong>@VPract_bot</strong> добавлен в ваш групповой чат или канал
                с правами администратора (для канала — право публиковать сообщения).
              </Typography>
              <Typography variant="body2" color="text.secondary">
                2. Отправьте в этот чат команду:
              </Typography>
              <Paper variant="outlined" sx={{ px: 2, py: 1, bgcolor: 'action.hover', fontFamily: 'monospace' }}>
                /link_staff
              </Paper>
              <Typography variant="body2" color="text.secondary">
                Бот ответит, когда привязка сохранится. Обновите эту страницу.
              </Typography>

              <Stack direction={isMobile ? 'column' : 'row'} spacing={1}>
                <Button variant="outlined" onClick={() => linkMutation.mutate(undefined)} disabled={linkMutation.isPending}>
                  Обновить статус
                </Button>
                {linked && (
                  <Button
                    color="inherit"
                    startIcon={<LinkOffIcon />}
                    onClick={() => clearMutation.mutate()}
                    disabled={clearMutation.isPending}
                  >
                    Отвязать
                  </Button>
                )}
              </Stack>

              <Typography variant="subtitle2" sx={{ pt: 1 }}>
                Или укажите Chat ID вручную
              </Typography>
              <Stack direction={isMobile ? 'column' : 'row'} spacing={1} alignItems={isMobile ? 'stretch' : 'flex-start'}>
                <TextField
                  size="small"
                  label="Chat ID"
                  placeholder="-1001234567890"
                  value={manualChatId}
                  onChange={(e) => setManualChatId(e.target.value)}
                  fullWidth={isMobile}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="contained"
                  disabled={manualMutation.isPending || !manualChatId.trim()}
                  onClick={() => {
                    const id = Number(manualChatId.trim());
                    if (!Number.isFinite(id)) {
                      notify('Некорректный Chat ID', 'error');
                      return;
                    }
                    manualMutation.mutate(id);
                  }}
                >
                  Сохранить
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Layout>
  );
}
