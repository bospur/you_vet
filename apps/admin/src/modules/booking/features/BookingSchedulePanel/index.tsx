import { useMemo, useState } from 'react';
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
import SaveIcon from '@mui/icons-material/Save';
import { useNotification } from '../../../../shared/ui/Notification/NotificationContext';
import { useAuth } from '../../../../shared/config/AuthContext';
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
  type BookingWindow,
  type BookingAvailabilityDay,
} from '../../../../data/source/booking';
import { bookingApiErrorMessage } from '../../domain/bookingApiError';
import { DAY_DISPLAY_ORDER, DAY_NAMES_FULL, DAY_NAMES_SHORT } from '../../domain/days';
import {
  countEnabledDays,
  emptyWeeklyDraft,
  type DayDraft,
  weeklyDraftFromRules,
  weeklyDraftsEqual,
  weeklyDraftSyncKey,
} from '../../domain/weeklyDraft';

function formatDateRu(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', weekday: 'short' });
}

export function BookingSchedulePanel() {
  const { notify } = useNotification();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'admin';
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));

  const [serviceId, setServiceId] = useState<number | ''>('');
  const [tab, setTab] = useState(0);
  const [weeklyDraft, setWeeklyDraft] = useState<Record<number, DayDraft>>(emptyWeeklyDraft);
  const [weeklySyncKey, setWeeklySyncKey] = useState('');
  const [horizonDraft, setHorizonDraft] = useState<number | null>(null);
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
    enabled: sid > 0,
  });

  const weeklyBaseline = useMemo(
    () => (sid > 0 && !weeklyLoading ? weeklyDraftFromRules(weekly) : emptyWeeklyDraft()),
    [sid, weekly, weeklyLoading],
  );

  const nextWeeklySyncKey = sid > 0 && !weeklyLoading ? weeklyDraftSyncKey(sid, weekly) : '';
  if (nextWeeklySyncKey !== weeklySyncKey) {
    setWeeklySyncKey(nextWeeklySyncKey);
    setWeeklyDraft(weeklyBaseline);
  }

  const { data: windows = [], isLoading: windowsLoading } = useQuery({
    queryKey: ['booking-windows', sid],
    queryFn: () => getBookingWindows(sid),
    enabled: sid > 0 && tab === 1,
  });

  const {
    data: availability,
    isLoading: calLoading,
    isError: calError,
    error: calErr,
    refetch: refetchCal,
  } = useQuery({
    queryKey: ['booking-availability', sid],
    queryFn: () => getBookingAvailability(sid),
    enabled: sid > 0,
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
      setHorizonDraft(null);
      notify('Горизонт записи сохранён', 'success');
    },
    onError: () => notify('Ошибка сохранения', 'error'),
  });

  const saveWeeklyMutation = useMutation({
    mutationFn: async () => {
      for (const day of DAY_DISPLAY_ORDER) {
        const d = weeklyDraft[day];
        const hadRule = weekly.some((r) => r.day_of_week === day);
        if (d.enabled) {
          await upsertBookingWeeklyRule(sid, {
            day_of_week: day,
            max_per_day: d.max_per_day,
            intake_from: d.intake_from,
            intake_to: d.intake_to,
            pickup_after: d.pickup_after,
          });
        } else if (hadRule) {
          await deleteBookingWeeklyRule(sid, day);
        }
      }
    },
    onSuccess: () => {
      invalidateSchedule();
      notify('Шаблон недели сохранён', 'success');
    },
    onError: () => notify('Ошибка сохранения шаблона', 'error'),
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

  const updateDraftDay = (day: number, patch: Partial<DayDraft>) => {
    setWeeklyDraft((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...patch },
    }));
  };

  const handleServiceChange = (nextId: number | '') => {
    setServiceId(nextId);
    setWeeklySyncKey('');
    setWeeklyDraft(emptyWeeklyDraft());
  };

  const displayHorizon = horizonDraft ?? settings?.horizon_weeks ?? 2;
  const horizonDirty = horizonDraft !== null && horizonDraft !== settings?.horizon_weeks;

  const enabledDaysInDraft = countEnabledDays(weeklyDraft);
  const hasWeeklyChanges = sid > 0 && !weeklyLoading && !weeklyDraftsEqual(weeklyDraft, weeklyBaseline);
  const canSaveWeekly = hasWeeklyChanges && enabledDaysInDraft > 0 && !saveWeeklyMutation.isPending;

  const weeklySaveHint = (() => {
    if (sid === 0 || weeklyLoading) return null;
    if (enabledDaysInDraft === 0) {
      return 'Включите переключатель хотя бы у одного дня недели.';
    }
    if (!hasWeeklyChanges) {
      return 'Нет изменений относительно сохранённого шаблона — измените дни, места или время.';
    }
    return null;
  })();

  const calErrorMessage = calError
    ? bookingApiErrorMessage(
      calErr,
      'Не удалось загрузить календарь. Убедитесь, что API обновлён и миграции 013–015 применены.',
    )
    : '';

  const openDaysCount = useMemo(
    () => availability?.days.filter((d) => d.is_open).length ?? 0,
    [availability],
  );

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems={{ sm: 'flex-start' }}>
        <TextField
          select
          label="Услуга"
          value={serviceId}
          onChange={(e) => handleServiceChange(e.target.value ? Number(e.target.value) : '')}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 280 } }}
          size="small"
          fullWidth={isMobile}
        >
          <MenuItem value="">Выберите услугу</MenuItem>
          {activeServices.map((s) => (
            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
          ))}
        </TextField>
        {isAdmin && settings ? (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <TextField
              select
              label="Горизонт (недель)"
              size="small"
              value={displayHorizon}
              onChange={(e) => setHorizonDraft(Number(e.target.value))}
              sx={{ width: { xs: '100%', sm: 160 } }}
              fullWidth={isMobile}
            >
              {[1, 2, 3, 4].map((w) => (
                <MenuItem key={w} value={w}>{w}</MenuItem>
              ))}
            </TextField>
            {horizonDirty && (
              <Button
                variant="contained"
                size="small"
                startIcon={<SaveIcon />}
                onClick={() => horizonMutation.mutate(displayHorizon)}
                disabled={horizonMutation.isPending}
              >
                Сохранить
              </Button>
            )}
          </Stack>
        ) : null}
      </Stack>

      {selected?.capacity_group && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Общий лимит на день для группы «{selected.capacity_group}» — кастрация и стерилизация настраиваются вместе.
        </Alert>
      )}

      {!serviceId && (
        <Typography color="text.secondary">Выберите услугу, чтобы настроить расписание.</Typography>
      )}

      {serviceId !== '' && (
        <>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons={isMobile ? 'auto' : false}
            allowScrollButtonsMobile
            sx={{ mb: 2 }}
          >
            <Tab label={isMobile ? 'Неделя' : 'Шаблон недели'} />
            <Tab label={isMobile ? 'Окна' : 'Разовые окна'} />
            <Tab label="Календарь" />
          </Tabs>

          {tab === 0 && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Включите дни приёма, укажите количество мест и нажмите «Сохранить шаблон».
              </Typography>
              {weeklyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
              ) : (
                <Stack spacing={1}>
                  {DAY_DISPLAY_ORDER.map((day) => {
                    const rule = weeklyDraft[day];
                    if (!rule) return null;
                    return (
                      <Stack
                        key={day}
                        direction={{ xs: 'column', md: 'row' }}
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                        spacing={1}
                        sx={{ py: 1, px: 1, borderRadius: 1, bgcolor: rule.enabled ? 'action.hover' : undefined }}
                      >
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={rule.enabled}
                              onChange={(e) => updateDraftDay(day, { enabled: e.target.checked })}
                            />
                          }
                          label={isMobile ? DAY_NAMES_SHORT[day] : DAY_NAMES_FULL[day]}
                          sx={{ minWidth: { sm: 140 }, m: 0 }}
                        />
                        {rule.enabled && (
                          <Stack
                            direction={isMobile ? 'column' : 'row'}
                            flexWrap="wrap"
                            gap={1}
                            sx={{ width: isMobile ? '100%' : 'auto' }}
                          >
                            <TextField
                              label="Мест"
                              type="number"
                              size="small"
                              value={rule.max_per_day}
                              onChange={(e) => updateDraftDay(day, { max_per_day: Number(e.target.value) })}
                              sx={{ width: isMobile ? '100%' : 80 }}
                              inputProps={{ min: 1 }}
                            />
                            <TextField
                              label="С"
                              type="time"
                              size="small"
                              fullWidth={isMobile}
                              value={rule.intake_from}
                              onChange={(e) => updateDraftDay(day, { intake_from: e.target.value })}
                              sx={{ width: isMobile ? '100%' : 120 }}
                            />
                            <TextField
                              label="До"
                              type="time"
                              size="small"
                              fullWidth={isMobile}
                              value={rule.intake_to}
                              onChange={(e) => updateDraftDay(day, { intake_to: e.target.value })}
                              sx={{ width: isMobile ? '100%' : 120 }}
                            />
                            <TextField
                              label="Забор после"
                              type="time"
                              size="small"
                              fullWidth={isMobile}
                              value={rule.pickup_after}
                              onChange={(e) => updateDraftDay(day, { pickup_after: e.target.value })}
                              sx={{ width: isMobile ? '100%' : 130 }}
                            />
                          </Stack>
                        )}
                      </Stack>
                    );
                  })}
                  {weeklySaveHint && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      {weeklySaveHint}
                    </Alert>
                  )}
                  <Box sx={{ pt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      disabled={!canSaveWeekly}
                      onClick={() => saveWeeklyMutation.mutate()}
                    >
                      {saveWeeklyMutation.isPending ? 'Сохранение…' : 'Сохранить шаблон'}
                    </Button>
                  </Box>
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
                <Typography color="text.secondary">Нет разовых окон — для УЗИ/рентгена на конкретные даты.</Typography>
              ) : (
                <Stack spacing={1}>
                  {windows.map((w: BookingWindow) => (
                    <Paper key={w.id} variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', gap: 1, flexDirection: isMobile ? 'column' : 'row' }}>
                      <Box>
                        <Typography fontWeight={600}>{w.date_from} — {w.date_to}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Мест в день: {w.max_per_day}
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
              {calLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
              )}

              {calError && (
                <Alert severity="error" sx={{ mb: 2 }} action={
                  <Button color="inherit" size="small" onClick={() => refetchCal()}>Повторить</Button>
                }>
                  {calErrorMessage}
                </Alert>
              )}

              {!calLoading && !calError && availability && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {formatDateRu(availability.from)} — {formatDateRu(availability.to)}
                    {' · '}горизонт {availability.horizon_weeks} нед.
                    {' · '}открытых дней: {openDaysCount}
                  </Typography>

                  {openDaysCount === 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Нет открытых дней — сначала включите дни в «Шаблон недели» и нажмите «Сохранить шаблон».
                    </Alert>
                  )}

                  {availability.days.length === 0 ? (
                    <Typography color="text.secondary">Нет дат в выбранном горизонте.</Typography>
                  ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 1 }}>
                      {availability.days.map((d: BookingAvailabilityDay) => (
                        <Paper
                          key={d.date}
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            cursor: 'pointer',
                            bgcolor: d.is_open ? 'background.paper' : 'action.disabledBackground',
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
                  )}
                </>
              )}
            </Box>
          )}
        </>
      )}

      <Dialog open={windowOpen} onClose={() => setWindowOpen(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle>Разовое окно</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="С даты" type="date" InputLabelProps={{ shrink: true }}
              value={windowForm.date_from} onChange={(e) => setWindowForm((f) => ({ ...f, date_from: e.target.value }))} fullWidth />
            <TextField label="По дату" type="date" InputLabelProps={{ shrink: true }}
              value={windowForm.date_to} onChange={(e) => setWindowForm((f) => ({ ...f, date_to: e.target.value }))} fullWidth />
            <TextField label="Мест в день" type="number" value={windowForm.max_per_day}
              onChange={(e) => setWindowForm((f) => ({ ...f, max_per_day: Number(e.target.value) }))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWindowOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={() => createWindowMutation.mutate()} disabled={createWindowMutation.isPending}>
            Создать
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!dayDialog} onClose={() => setDayDialog(null)} maxWidth="xs" fullWidth fullScreen={isMobile}>
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
        <DialogActions sx={{ flexDirection: isMobile ? 'column' : 'row', gap: 1, px: 2, pb: 2 }}>
          <Button color="inherit" fullWidth={isMobile} onClick={() => dayDialog && deleteBookingDayOverride(sid, dayDialog.date).then(invalidateSchedule).then(() => {
            setDayDialog(null);
            notify('Сброшено к шаблону', 'success');
          })}>
            Сбросить правку
          </Button>
          <Button fullWidth={isMobile} onClick={() => setDayDialog(null)}>Отмена</Button>
          <Button
            variant="contained"
            fullWidth={isMobile}
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
    </>
  );
}
