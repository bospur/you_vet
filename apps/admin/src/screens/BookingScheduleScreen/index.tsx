import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { Layout } from '../../shared/ui/Layout';
import { useNotification } from '../../shared/ui/Notification/NotificationContext';
import { useAuth } from '../../shared/config/AuthContext';
import {
  getBookingServiceTypes,
  getBookingSettings,
  updateBookingHorizon,
  getBookingWeeklyRules,
  upsertBookingWeeklyRule,
  deleteBookingWeeklyRule,
  getBookingWindows,
  createBookingWindow,
  deleteBookingWindow,
  getBookingAvailability,
  upsertBookingDayOverride,
  deleteBookingDayOverride,
  type BookingWeeklyRule,
} from '../../data/source/booking';
import { DAY_DISPLAY_ORDER, DAY_NAMES_FULL } from '../../modules/booking/domain/days';

function formatDateRu(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', weekday: 'short' });
}

export function BookingScheduleScreen() {
  const { notify } = useNotification();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'admin';
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));

  const [serviceId, setServiceId] = useState<number | ''>('');
  const [tab, setTab] = useState(0);
  const [windowOpen, setWindowOpen] = useState(false);
  const [windowForm, setWindowForm] = useState({
    date_from: '',
    date_to: '',
    max_per_day: 5,
    days_of_week: [] as number[],
  });
  const [dayDialog, setDayDialog] = useState<{ date: string; is_open: boolean; max_slots: number } | null>(null);

  const { data: services = [] } = useQuery({
    queryKey: ['booking-service-types'],
    queryFn: getBookingServiceTypes,
  });

  const activeServices = services.filter((s) => s.is_active);
  const selected = activeServices.find((s) => s.id === serviceId);
  const sid = typeof serviceId === 'number' ? serviceId : 0;

  const { data: settings } = useQuery({
    queryKey: ['booking-settings'],
    queryFn: getBookingSettings,
  });

  const { data: weekly = [], isLoading: weeklyLoading } = useQuery({
    queryKey: ['booking-weekly', sid],
    queryFn: () => getBookingWeeklyRules(sid),
    enabled: sid > 0 && tab === 0,
  });

  const { data: windows = [], isLoading: windowsLoading } = useQuery({
    queryKey: ['booking-windows', sid],
    queryFn: () => getBookingWindows(sid),
    enabled: sid > 0 && tab === 1,
  });

  const { data: availability, isLoading: calLoading } = useQuery({
    queryKey: ['booking-availability', sid],
    queryFn: () => getBookingAvailability(sid),
    enabled: sid > 0 && tab === 2,
  });

  const invalidateSchedule = () => {
    qc.invalidateQueries({ queryKey: ['booking-weekly', sid] });
    qc.invalidateQueries({ queryKey: ['booking-windows', sid] });
    qc.invalidateQueries({ queryKey: ['booking-availability', sid] });
  };

  const horizonMutation = useMutation({
    mutationFn: updateBookingHorizon,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking-settings'] });
      qc.invalidateQueries({ queryKey: ['booking-availability', sid] });
      notify('Горизонт записи сохранён', 'success');
    },
    onError: () => notify('Ошибка сохранения', 'error'),
  });

  const upsertWeeklyMutation = useMutation({
    mutationFn: (payload: Parameters<typeof upsertBookingWeeklyRule>[1]) =>
      upsertBookingWeeklyRule(sid, payload),
    onSuccess: invalidateSchedule,
    onError: () => notify('Ошибка сохранения шаблона', 'error'),
  });

  const deleteWeeklyMutation = useMutation({
    mutationFn: (day: number) => deleteBookingWeeklyRule(sid, day),
    onSuccess: () => {
      invalidateSchedule();
      notify('День убран из шаблона', 'success');
    },
    onError: () => notify('Ошибка', 'error'),
  });

  const createWindowMutation = useMutation({
    mutationFn: () => createBookingWindow(sid, windowForm),
    onSuccess: () => {
      invalidateSchedule();
      setWindowOpen(false);
      notify('Окно добавлено', 'success');
    },
    onError: () => notify('Ошибка создания окна', 'error'),
  });

  const deleteWindowMutation = useMutation({
    mutationFn: deleteBookingWindow,
    onSuccess: () => {
      invalidateSchedule();
      notify('Окно удалено', 'success');
    },
    onError: () => notify('Ошибка', 'error'),
  });

  const overrideMutation = useMutation({
    mutationFn: (body: { date: string; max_per_day?: number | null; is_closed: boolean }) =>
      upsertBookingDayOverride(sid, body),
    onSuccess: () => {
      invalidateSchedule();
      setDayDialog(null);
      notify('День обновлён', 'success');
    },
    onError: () => notify('Ошибка', 'error'),
  });

  const ruleForDay = (day: number): BookingWeeklyRule | undefined =>
    weekly.find((r) => r.day_of_week === day);

  const handleToggleDay = (day: number, enabled: boolean) => {
    if (!enabled) {
      deleteWeeklyMutation.mutate(day);
      return;
    }
    upsertWeeklyMutation.mutate({
      day_of_week: day,
      max_per_day: 10,
      intake_from: '12:00',
      intake_to: '13:00',
      pickup_after: '17:00',
    });
  };

  const handleWeeklyField = (
    day: number,
    field: 'max_per_day' | 'intake_from' | 'intake_to' | 'pickup_after',
    value: string | number,
  ) => {
    const rule = ruleForDay(day);
    if (!rule) return;
    upsertWeeklyMutation.mutate({
      day_of_week: day,
      max_per_day: field === 'max_per_day' ? Number(value) : rule.max_per_day,
      intake_from: field === 'intake_from' ? String(value) : rule.intake_from,
      intake_to: field === 'intake_to' ? String(value) : rule.intake_to,
      pickup_after: field === 'pickup_after' ? String(value) : rule.pickup_after,
    });
  };

  const saving = upsertWeeklyMutation.isPending || deleteWeeklyMutation.isPending;

  return (
    <Layout title="Запись — Расписание">
      <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>Расписание и ёмкость</Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          select
          label="Услуга"
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value ? Number(e.target.value) : '')}
          sx={{ minWidth: 280 }}
          size="small"
        >
          <MenuItem value="">Выберите услугу</MenuItem>
          {activeServices.map((s) => (
            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
          ))}
        </TextField>
        {isAdmin && settings && (
          <TextField
            select
            label="Горизонт (недель)"
            size="small"
            value={settings.horizon_weeks}
            onChange={(e) => horizonMutation.mutate(Number(e.target.value))}
            disabled={horizonMutation.isPending}
            sx={{ width: 160 }}
          >
            {[1, 2, 3, 4].map((w) => (
              <MenuItem key={w} value={w}>{w}</MenuItem>
            ))}
          </TextField>
        )}
      </Stack>

      {selected?.capacity_group && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Общий лимит на день для группы «{selected.capacity_group}» — настройки вт/чт для кастрации и стерилизации редактируются вместе (откройте любую из этих услуг).
        </Alert>
      )}

      {!serviceId && (
        <Typography color="text.secondary">Выберите услугу, чтобы настроить расписание.</Typography>
      )}

      {serviceId !== '' && (
        <>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Шаблон недели" />
            <Tab label="Разовые окна" />
            <Tab label="Календарь" />
          </Tabs>

          {tab === 0 && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              {weeklyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
              ) : (
                <Stack spacing={1}>
                  {DAY_DISPLAY_ORDER.map((day) => {
                    const rule = ruleForDay(day);
                    const enabled = !!rule;
                    return (
                      <Stack
                        key={day}
                        direction={{ xs: 'column', md: 'row' }}
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                        spacing={1}
                        sx={{ py: 1, px: 1, borderRadius: 1, bgcolor: enabled ? 'action.hover' : undefined }}
                      >
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={enabled}
                              disabled={saving}
                              onChange={(e) => handleToggleDay(day, e.target.checked)}
                            />
                          }
                          label={DAY_NAMES_FULL[day]}
                          sx={{ minWidth: 140, m: 0 }}
                        />
                        {enabled && rule && (
                          <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                            <TextField
                              label="Мест"
                              type="number"
                              size="small"
                              value={rule.max_per_day}
                              onChange={(e) => handleWeeklyField(day, 'max_per_day', e.target.value)}
                              disabled={saving}
                              sx={{ width: 80 }}
                              inputProps={{ min: 1 }}
                            />
                            <TextField label="С" type="time" size="small" value={(rule.intake_from ?? '').slice(0, 5)}
                              onChange={(e) => handleWeeklyField(day, 'intake_from', e.target.value)} disabled={saving} sx={{ width: 120 }} />
                            <TextField label="До" type="time" size="small" value={(rule.intake_to ?? '').slice(0, 5)}
                              onChange={(e) => handleWeeklyField(day, 'intake_to', e.target.value)} disabled={saving} sx={{ width: 120 }} />
                            <TextField label="Забор после" type="time" size="small" value={(rule.pickup_after ?? '').slice(0, 5)}
                              onChange={(e) => handleWeeklyField(day, 'pickup_after', e.target.value)} disabled={saving} sx={{ width: 130 }} />
                          </Stack>
                        )}
                      </Stack>
                    );
                  })}
                </Stack>
              )}
            </Paper>
          )}

          {tab === 1 && (
            <Box>
              <Button startIcon={<AddIcon />} variant="outlined" sx={{ mb: 2 }} onClick={() => setWindowOpen(true)}>
                Добавить окно
              </Button>
              {windowsLoading ? (
                <CircularProgress />
              ) : windows.length === 0 ? (
                <Typography color="text.secondary">Нет разовых окон — используйте для УЗИ/рентгена на конкретные даты.</Typography>
              ) : (
                <Stack spacing={1}>
                  {windows.map((w) => (
                    <Paper key={w.id} variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography fontWeight={600}>{w.date_from} — {w.date_to}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Мест в день: {w.max_per_day}
                          {w.days_of_week?.length ? ` · дни: ${w.days_of_week.map((d) => DAY_NAMES_FULL[d]?.slice(0, 2)).join(', ')}` : ' · все дни периода'}
                        </Typography>
                      </Box>
                      <IconButton color="error" onClick={() => deleteWindowMutation.mutate(w.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          )}

          {tab === 2 && (
            <Box>
              {calLoading ? (
                <CircularProgress />
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {availability?.from} — {availability?.to} · горизонт {availability?.horizon_weeks} нед.
                    Нажмите на день для закрытия или смены лимита.
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                      gap: 1,
                    }}
                  >
                    {availability?.days.map((d) => (
                      <Paper
                        key={d.date}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          cursor: 'pointer',
                          bgcolor: d.is_open ? 'background.paper' : 'action.disabledBackground',
                          borderColor: d.is_open ? 'divider' : 'transparent',
                        }}
                        onClick={() => setDayDialog({
                          date: d.date,
                          is_open: d.is_open,
                          max_slots: d.max_slots || 1,
                        })}
                      >
                        <Typography variant="caption" color="text.secondary">{formatDateRu(d.date)}</Typography>
                        <Typography fontWeight={600}>
                          {d.is_open ? `${d.remaining}/${d.max_slots}` : 'Закрыто'}
                        </Typography>
                        {d.is_open && d.booked_slots > 0 && (
                          <Typography variant="caption">занято: {d.booked_slots}</Typography>
                        )}
                      </Paper>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          )}
        </>
      )}

      <Dialog open={windowOpen} onClose={() => setWindowOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Разовое окно</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="С даты" type="date" InputLabelProps={{ shrink: true }}
              value={windowForm.date_from} onChange={(e) => setWindowForm((f) => ({ ...f, date_from: e.target.value }))} fullWidth />
            <TextField label="По дату" type="date" InputLabelProps={{ shrink: true }}
              value={windowForm.date_to} onChange={(e) => setWindowForm((f) => ({ ...f, date_to: e.target.value }))} fullWidth />
            <TextField label="Мест в день" type="number" value={windowForm.max_per_day}
              onChange={(e) => setWindowForm((f) => ({ ...f, max_per_day: Number(e.target.value) }))} fullWidth />
            <Typography variant="caption" color="text.secondary">
              Дни недели можно добавить позже; пусто = все дни в периоде.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWindowOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={() => createWindowMutation.mutate()} disabled={createWindowMutation.isPending}>
            Создать
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!dayDialog} onClose={() => setDayDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{dayDialog && formatDateRu(dayDialog.date)}</DialogTitle>
        <DialogContent>
          {dayDialog && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={dayDialog.is_open}
                    onChange={(e) => setDayDialog({ ...dayDialog, is_open: e.target.checked })}
                  />
                }
                label="Приём открыт"
              />
              {dayDialog.is_open && (
                <TextField
                  label="Мест в этот день"
                  type="number"
                  value={dayDialog.max_slots}
                  onChange={(e) => setDayDialog({ ...dayDialog, max_slots: Number(e.target.value) })}
                  fullWidth
                  inputProps={{ min: 1 }}
                />
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            color="inherit"
            onClick={() => dayDialog && deleteBookingDayOverride(sid, dayDialog.date).then(invalidateSchedule).then(() => {
              setDayDialog(null);
              notify('Сброшено к шаблону', 'success');
            })}
          >
            Сбросить правку
          </Button>
          <Button onClick={() => setDayDialog(null)}>Отмена</Button>
          <Button
            variant="contained"
            disabled={overrideMutation.isPending || !dayDialog}
            onClick={() => dayDialog && overrideMutation.mutate({
              date: dayDialog.date,
              is_closed: !dayDialog.is_open,
              max_per_day: dayDialog.is_open ? dayDialog.max_slots : null,
            })}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
