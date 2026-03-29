import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Avatar, Box, Chip, CircularProgress, FormControl,
  InputLabel, MenuItem, Paper, Select, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, useMediaQuery, useTheme,
} from '@mui/material';
import { Layout } from '../../shared/ui/Layout';
import { getDoctors, getSettings, updateSettings } from '../../data/source/doctors';
import { useNotification } from '../../shared/ui/Notification/NotificationContext';
import { useAuth } from '../../shared/config/AuthContext';
import type { DoctorScheduleSlot } from '../../modules/doctors/domain/types';
import { getDoctorSchedule, getExceptions } from '../../data/source/doctors';
import { useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

const PERIOD_OPTIONS = [
  { value: 1, label: '1 неделя' },
  { value: 2, label: '2 недели' },
  { value: 3, label: '3 недели' },
  { value: 4, label: '4 недели' },
  { value: 5, label: 'Месяц' },
];

// Генерируем даты на период (для превью в админке)
function generateDates(weeks: number): Date[] {
  const days = weeks === 5 ? 31 : weeks * 7;
  const result: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    result.push(d);
  }
  return result;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function ScheduleScreen() {
  const { notify } = useNotification();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));

  const { data: doctors = [], isLoading: doctorsLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: getDoctors,
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['clinic-settings'],
    queryFn: getSettings,
  });

  // Загружаем расписание для всех опубликованных врачей
  const publishedDoctors = doctors.filter((d) => d.status === 'published');

  const schedulesQueries = useQuery({
    queryKey: ['all-schedules', publishedDoctors.map((d) => d.id)],
    queryFn: async () => {
      const results = await Promise.all(
        publishedDoctors.map(async (d) => ({
          doctorId: d.id,
          slots: await getDoctorSchedule(d.id),
          exceptions: await getExceptions(d.id),
        })),
      );
      return results;
    },
    enabled: publishedDoctors.length > 0,
  });

  const settingsMutation = useMutation({
    mutationFn: (weeks: number) => updateSettings(weeks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-settings'] });
      notify('Настройки сохранены', 'success');
    },
    onError: () => notify('Ошибка сохранения настроек', 'error'),
  });

  const isLoading = doctorsLoading || settingsLoading || schedulesQueries.isLoading;
  const weeks = settings?.schedule_display_weeks ?? 2;

  // Строим матрицу расписания
  const dates = generateDates(weeks);
  const scheduleData = schedulesQueries.data ?? [];

  // Для каждой даты собираем кто работает
  const matrix = dates.map((date) => {
    const dow = date.getDay();
    const iso = isoDate(date);

    const working = publishedDoctors.flatMap((doc) => {
      const entry = scheduleData.find((s) => s.doctorId === doc.id);
      if (!entry) return [];

      // Проверяем исключение
      const exception = entry.exceptions.find((e) => e.date === iso);
      if (exception) {
        if (exception.is_day_off) return [];
        if (exception.time_from && exception.time_to) {
          return [{ doc, time_from: exception.time_from, time_to: exception.time_to }];
        }
      }

      // Базовый слот по дню недели
      const slots = entry.slots.filter((s: DoctorScheduleSlot) => s.day_of_week === dow);
      return slots.map((s: DoctorScheduleSlot) => ({ doc, time_from: s.time_from, time_to: s.time_to }));
    });

    return { date, working };
  }).filter((row) => row.working.length > 0);

  return (
    <Layout title="Расписание">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" fontWeight={600}>Расписание</Typography>
        {isAdmin && (
          <FormControl size="small" sx={{ minWidth: isMobile ? '100%' : 160 }}>
            <InputLabel>Период отображения</InputLabel>
            <Select
              label="Период отображения"
              value={weeks}
              disabled={settingsMutation.isPending}
              onChange={(e) => settingsMutation.mutate(Number(e.target.value))}
            >
              {PERIOD_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!isLoading && publishedDoctors.length === 0 && (
        <Typography color="text.secondary">
          Нет опубликованных врачей. <span
            style={{ color: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}
            onClick={() => navigate('/doctors')}
          >Перейти к врачам</span>
        </Typography>
      )}

      {!isLoading && publishedDoctors.length > 0 && matrix.length === 0 && (
        <Typography color="text.secondary">
          Расписание не заполнено. Добавьте слоты в карточках врачей.
        </Typography>
      )}

      {!isLoading && matrix.length > 0 && (
        isMobile ? (
          <Stack spacing={1.5}>
            {matrix.map(({ date, working }) => (
              <Paper key={isoDate(date)} sx={{ p: 2 }}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" mb={1}>
                  {formatDate(date)}
                </Typography>
                <Stack spacing={1}>
                  {working.map(({ doc, time_from, time_to }, i) => (
                    <Box
                      key={i}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
                      onClick={() => navigate(`/doctors/${doc.id}/edit`)}
                    >
                      <Avatar
                        src={doc.photo_url ? `${BASE_URL}${doc.photo_url}` : undefined}
                        sx={{ width: 36, height: 36, fontSize: 16 }}
                      >
                        {doc.full_name[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>{doc.full_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {time_from.slice(0, 5)} – {time_to.slice(0, 5)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 140 }}>Дата</TableCell>
                  <TableCell>Врачи</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {matrix.map(({ date, working }) => (
                  <TableRow key={isoDate(date)} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{formatDate(date)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {working.map(({ doc, time_from, time_to }, i) => (
                          <Box
                            key={i}
                            sx={{
                              display: 'flex', alignItems: 'center', gap: 1,
                              border: '1px solid', borderColor: 'divider',
                              borderRadius: 2, px: 1.5, py: 0.5,
                              cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' },
                            }}
                            onClick={() => navigate(`/doctors/${doc.id}/edit`)}
                          >
                            <Avatar
                              src={doc.photo_url ? `${BASE_URL}${doc.photo_url}` : undefined}
                              sx={{ width: 28, height: 28, fontSize: 14 }}
                            >
                              {doc.full_name[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" lineHeight={1.2}>{doc.full_name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {time_from.slice(0, 5)} – {time_to.slice(0, 5)}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {!isLoading && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" mb={1}>Все врачи</Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {doctors.map((d) => (
              <Chip
                key={d.id}
                avatar={
                  <Avatar src={d.photo_url ? `${BASE_URL}${d.photo_url}` : undefined}>
                    {d.full_name[0]}
                  </Avatar>
                }
                label={`${d.full_name}${d.status === 'draft' ? ' (черновик)' : ''}`}
                variant={d.status === 'published' ? 'filled' : 'outlined'}
                onClick={() => navigate(`/doctors/${d.id}/edit`)}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Layout>
  );
}
