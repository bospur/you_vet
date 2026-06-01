import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Avatar, Box, Button, Chip, CircularProgress, FormControl,
  InputLabel, MenuItem, Paper, Select, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, useMediaQuery, useTheme,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import { Layout } from '../../shared/ui/Layout';
import { getDoctors, getSettings, getSchedulePeriod, updateSettings } from '../../data/source/doctors';
import { useNotification } from '../../shared/ui/Notification/NotificationContext';
import { useAuth } from '../../shared/config/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  formatScheduleDate,
  generateDatesFromToday,
  isoDateLocal,
} from '../../modules/doctors/domain/scheduleDates';
import { buildScheduleMatrix, formatTimeRange } from '../../modules/doctors/domain/scheduleMatrix';
import {
  buildWeeklyScheduleHtml,
  downloadWeeklyScheduleHtml,
  printWeeklyScheduleHtml,
} from '../../modules/doctors/domain/weeklyScheduleExport';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

const PERIOD_OPTIONS = [
  { value: 1, label: '1 неделя' },
  { value: 2, label: '2 недели' },
  { value: 3, label: '3 недели' },
  { value: 4, label: '4 недели' },
  { value: 5, label: 'Месяц' },
];

const MANAGER_WEEKS = 1;

export function ScheduleScreen() {
  const { notify } = useNotification();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canEdit = !isManager;
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));

  const { data: doctors = [], isLoading: doctorsLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: getDoctors,
    enabled: canEdit,
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['clinic-settings'],
    queryFn: getSettings,
    enabled: !isManager,
  });

  const weeks = isManager ? MANAGER_WEEKS : (settings?.schedule_display_weeks ?? 2);
  const dates = useMemo(() => generateDatesFromToday(weeks), [weeks]);
  const from = isoDateLocal(dates[0]);
  const to = isoDateLocal(dates[dates.length - 1]);

  const { data: scheduleResponse, isLoading: scheduleLoading } = useQuery({
    queryKey: ['admin-schedule', from, to],
    queryFn: () => getSchedulePeriod(from, to),
  });

  const settingsMutation = useMutation({
    mutationFn: (value: number) => updateSettings(value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-settings'] });
      notify('Настройки сохранены', 'success');
    },
    onError: () => notify('Ошибка сохранения настроек', 'error'),
  });

  const matrix = useMemo(
    () => buildScheduleMatrix(dates, scheduleResponse?.entries ?? []),
    [dates, scheduleResponse?.entries],
  );

  const visibleMatrix = matrix.filter((row) => row.working.length > 0);

  const weeklyExportDates = useMemo(() => generateDatesFromToday(1), []);
  const weeklyFrom = isoDateLocal(weeklyExportDates[0]);
  const weeklyTo = isoDateLocal(weeklyExportDates[weeklyExportDates.length - 1]);

  const { data: weeklySchedule } = useQuery({
    queryKey: ['admin-schedule-weekly-export', weeklyFrom, weeklyTo],
    queryFn: () => getSchedulePeriod(weeklyFrom, weeklyTo),
    staleTime: 1000 * 60 * 5,
  });

  const weeklyRows = useMemo(
    () => buildScheduleMatrix(weeklyExportDates, weeklySchedule?.entries ?? []),
    [weeklyExportDates, weeklySchedule?.entries],
  );

  const handleExport = (mode: 'print' | 'download') => {
    const html = buildWeeklyScheduleHtml(weeklyRows, weeklyFrom, weeklyTo);
    if (mode === 'print') {
      printWeeklyScheduleHtml(html);
    } else {
      downloadWeeklyScheduleHtml(html, weeklyFrom, weeklyTo);
      notify('Файл скачан', 'success');
    }
  };

  const isLoading = scheduleLoading || (canEdit && (doctorsLoading || settingsLoading));

  const openDoctor = (doctorId: number) => {
    if (canEdit) navigate(`/doctors/${doctorId}/edit`);
  };

  return (
    <Layout title="Расписание">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={600}>Расписание врачей</Typography>
          {isManager && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              На ближайшую неделю · для печати на кассе
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('download')}
            disabled={!weeklySchedule}
          >
            Скачать неделю
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<PrintIcon />}
            onClick={() => handleExport('print')}
            disabled={!weeklySchedule}
          >
            Печать
          </Button>
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
        </Stack>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!isLoading && visibleMatrix.length === 0 && (
        <Typography color="text.secondary">
          {canEdit ? (
            <>
              Расписание не заполнено. Добавьте слоты в{' '}
              <span
                style={{ textDecoration: 'underline', cursor: 'pointer' }}
                onClick={() => navigate('/doctors')}
              >
                карточках врачей
              </span>
              .
            </>
          ) : (
            'Расписание на эту неделю пока не заполнено.'
          )}
        </Typography>
      )}

      {!isLoading && visibleMatrix.length > 0 && (
        isMobile ? (
          <Stack spacing={1.5}>
            {visibleMatrix.map(({ date, dateObj, working }) => (
              <Paper key={date} sx={{ p: 2 }}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" mb={1}>
                  {formatScheduleDate(dateObj)}
                </Typography>
                <Stack spacing={1}>
                  {working.map((doc) => (
                    <Box
                      key={`${doc.doctor_id}-${doc.time_from}`}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        cursor: canEdit ? 'pointer' : 'default',
                      }}
                      onClick={() => openDoctor(doc.doctor_id)}
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
                          {doc.specialty ? `${doc.specialty} · ` : ''}
                          {formatTimeRange(doc.time_from, doc.time_to)}
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
                {visibleMatrix.map(({ date, dateObj, working }) => (
                  <TableRow key={date} hover={canEdit}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{formatScheduleDate(dateObj)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {working.map((doc) => (
                          <Box
                            key={`${doc.doctor_id}-${doc.time_from}`}
                            sx={{
                              display: 'flex', alignItems: 'center', gap: 1,
                              border: '1px solid', borderColor: 'divider',
                              borderRadius: 2, px: 1.5, py: 0.5,
                              cursor: canEdit ? 'pointer' : 'default',
                              ...(canEdit ? { '&:hover': { bgcolor: 'action.hover' } } : {}),
                            }}
                            onClick={() => openDoctor(doc.doctor_id)}
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
                                {doc.specialty ? `${doc.specialty} · ` : ''}
                                {formatTimeRange(doc.time_from, doc.time_to)}
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

      {!isLoading && canEdit && doctors.length > 0 && (
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
