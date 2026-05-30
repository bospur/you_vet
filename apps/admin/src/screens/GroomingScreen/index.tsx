import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Layout } from '../../shared/ui/Layout';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { useNotification } from '../../shared/ui/Notification/NotificationContext';
import {
  getBreeds, createBreed, updateBreed, deleteBreed,
  getTemplate, getAppointments, createAppointment, deleteAppointment,
} from '../../data/source/grooming';
import { BreedsTable } from '../../modules/grooming/features/BreedsTable';
import { BreedFormDialog } from '../../modules/grooming/features/BreedFormDialog';
import { WeeklyTemplate } from '../../modules/grooming/features/WeeklyTemplate';
import { DayTimeline, DayTimelineEmpty, DayAppointmentBadges } from '../../modules/grooming/features/DayTimeline';
import { AppointmentFormDialog } from '../../modules/grooming/features/AppointmentFormDialog';
import type { GroomingBreed, GroomingAppointmentInput } from '../../modules/grooming/domain/types';

// ── Утилиты ──────────────────────────────────────────────────────────────────

function toYearMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildCalendarDays(year: number, month: number): (Date | null)[] {
  // month: 0-based
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Сдвиг: Пн=0 для отображения (firstDay.getDay() 0=Вс → offset 6, 1=Пн → 0, ...)
  const offset = (firstDay.getDay() + 6) % 7;
  const cells: (Date | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(new Date(year, month, d));
  }
  // Добиваем до полной строки
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const MONTH_NAMES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

// ── Главный экран ─────────────────────────────────────────────────────────────

export function GroomingScreen() {
  const { notify } = useNotification();
  const qc = useQueryClient();

  // Таб
  const [mainTab, setMainTab] = useState(0); // 0=Породы, 1=Расписание
  const [scheduleTab, setScheduleTab] = useState(0); // 0=Шаблон, 1=Записи

  // ── Состояние пород ──
  const [breedDialog, setBreedDialog] = useState<{ open: boolean; breed: GroomingBreed | null }>({
    open: false, breed: null,
  });
  const [deleteBreedTarget, setDeleteBreedTarget] = useState<GroomingBreed | null>(null);

  // ── Состояние календаря ──
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // ── Состояние записей ──
  const [apptDialog, setApptDialog] = useState<{ open: boolean; prefillTime?: string }>({ open: false });

  // ── Запросы ──

  const { data: breeds = [], isLoading: breedsLoading } = useQuery({
    queryKey: ['grooming-breeds'],
    queryFn: getBreeds,
  });

  const { data: templateSlots = [] } = useQuery({
    queryKey: ['grooming-template'],
    queryFn: getTemplate,
    enabled: mainTab === 1,
  });

  const currentMonth = toYearMonth(new Date(calYear, calMonth));
  const { data: appointments = [], isLoading: apptsLoading } = useQuery({
    queryKey: ['grooming-appointments', currentMonth],
    queryFn: () => getAppointments(currentMonth),
    enabled: mainTab === 1 && scheduleTab === 1,
  });

  // ── Мутации пород ──

  const createBreedMutation = useMutation({
    mutationFn: createBreed,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grooming-breeds'] });
      setBreedDialog({ open: false, breed: null });
      notify('Порода создана', 'success');
    },
    onError: () => notify('Ошибка создания породы', 'error'),
  });

  const updateBreedMutation = useMutation({
    mutationFn: ({ id, ...input }: { id: number } & Parameters<typeof updateBreed>[1]) =>
      updateBreed(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grooming-breeds'] });
      setBreedDialog({ open: false, breed: null });
      notify('Порода обновлена', 'success');
    },
    onError: () => notify('Ошибка обновления', 'error'),
  });

  const deleteBreedMutation = useMutation({
    mutationFn: (id: number) => deleteBreed(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grooming-breeds'] });
      setDeleteBreedTarget(null);
      notify('Порода удалена', 'success');
    },
    onError: () => notify('Ошибка удаления', 'error'),
  });

  // ── Мутации записей ──

  const createApptMutation = useMutation({
    mutationFn: (input: GroomingAppointmentInput) => createAppointment(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grooming-appointments', currentMonth] });
      setApptDialog({ open: false });
      notify('Запись создана', 'success');
    },
    onError: (err: unknown) => {
      const data =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: string } }).response?.data
          : undefined;
      const msg = data ?? 'Ошибка создания записи';
      notify(msg, 'error');
    },
  });

  const deleteApptMutation = useMutation({
    mutationFn: (id: number) => deleteAppointment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grooming-appointments', currentMonth] });
      notify('Запись удалена', 'success');
    },
    onError: () => notify('Ошибка удаления записи', 'error'),
  });

  // ── Вспомогательные данные ──

  const templateMap = Object.fromEntries(templateSlots.map((s) => [s.day_of_week, s]));

  const appointmentsByDate = appointments.reduce<Record<string, typeof appointments>>((acc, a) => {
    (acc[a.date] ??= []).push(a);
    return acc;
  }, {});

  const calDays = buildCalendarDays(calYear, calMonth);

  const selectedSlot = selectedDate
    ? (() => {
        const dow = (new Date(selectedDate + 'T00:00:00').getDay());
        return templateMap[dow];
      })()
    : undefined;

  const selectedAppointments = selectedDate ? (appointmentsByDate[selectedDate] ?? []) : [];

  // ── Обработчики ──

  const handleBreedSubmit = (values: Parameters<typeof createBreed>[0]) => {
    if (breedDialog.breed) {
      updateBreedMutation.mutate({ id: breedDialog.breed.id, ...values });
    } else {
      createBreedMutation.mutate(values);
    }
  };

  const handleApptSubmit = (values: GroomingAppointmentInput & { date: string }) => {
    createApptMutation.mutate(values);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(toDateString(date));
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
    setSelectedDate(null);
  };

  // ── Рендер ──

  return (
    <Layout title="Груминг">
      <Box>
        <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)} sx={{ mb: 3 }}>
          <Tab label="Коллекция пород" />
          <Tab label="Расписание" />
        </Tabs>

        {/* ─── Таб 0: Породы ─────────────────────────────────────────────── */}
        {mainTab === 0 && (
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Коллекция пород</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setBreedDialog({ open: true, breed: null })}
              >
                Добавить породу
              </Button>
            </Stack>
            {breedsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : breeds.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                Коллекция пуста. Добавьте первую породу.
              </Typography>
            ) : (
              <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                <BreedsTable
                  data={breeds}
                  onEdit={(b) => setBreedDialog({ open: true, breed: b })}
                  onDelete={(b) => setDeleteBreedTarget(b)}
                />
              </Paper>
            )}
          </Box>
        )}

        {/* ─── Таб 1: Расписание ─────────────────────────────────────────── */}
        {mainTab === 1 && (
          <Box>
            <Tabs value={scheduleTab} onChange={(_, v) => { setScheduleTab(v); setSelectedDate(null); }} sx={{ mb: 3 }}>
              <Tab label="Шаблон недели" />
              <Tab label="Записи" />
            </Tabs>

            {/* Шаблон */}
            {scheduleTab === 0 && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <WeeklyTemplate />
              </Paper>
            )}

            {/* Записи */}
            {scheduleTab === 1 && (
              <Stack spacing={3}>
                {/* Календарь */}
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {/* Шапка месяца */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                    <Tooltip title="Предыдущий месяц">
                      <IconButton size="small" onClick={prevMonth}><ChevronLeftIcon /></IconButton>
                    </Tooltip>
                    <Typography fontWeight={600}>
                      {MONTH_NAMES[calMonth]} {calYear}
                    </Typography>
                    <Tooltip title="Следующий месяц">
                      <IconButton size="small" onClick={nextMonth}><ChevronRightIcon /></IconButton>
                    </Tooltip>
                  </Stack>

                  {/* Дни недели */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
                      <Typography
                        key={d}
                        variant="caption"
                        align="center"
                        color="text.secondary"
                        sx={{ py: 0.5, fontWeight: 600 }}
                      >
                        {d}
                      </Typography>
                    ))}
                  </Box>

                  {/* Ячейки */}
                  {apptsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                      {calDays.map((date, i) => {
                        if (!date) return <Box key={`empty-${i}`} />;

                        const dateStr = toDateString(date);
                        const dow = date.getDay(); // 0=Вс
                        const isWorking = !!templateMap[dow];
                        const dayAppts = appointmentsByDate[dateStr] ?? [];
                        const isSelected = selectedDate === dateStr;
                        const isToday = toDateString(today) === dateStr;

                        return (
                          <Box
                            key={dateStr}
                            onClick={() => isWorking && handleDayClick(date)}
                            sx={{
                              border: '1px solid',
                              borderColor: isSelected ? 'primary.main' : 'divider',
                              borderRadius: 1,
                              p: { xs: 0.5, sm: 0.75 },
                              cursor: isWorking ? 'pointer' : 'default',
                              bgcolor: isSelected
                                ? 'primary.light'
                                : isToday
                                ? 'action.selected'
                                : isWorking
                                ? 'background.paper'
                                : 'action.disabledBackground',
                              opacity: isWorking ? 1 : 0.5,
                              minHeight: { xs: 44, sm: 64 },
                              '&:hover': isWorking ? { bgcolor: isSelected ? 'primary.light' : 'action.hover' } : {},
                              transition: 'background-color 0.15s',
                            }}
                          >
                            <Typography
                              variant="caption"
                              fontWeight={isToday ? 700 : 400}
                              color={isSelected ? 'primary.dark' : 'text.primary'}
                              display="block"
                              textAlign="center"
                            >
                              {date.getDate()}
                            </Typography>
                            <DayAppointmentBadges appointments={dayAppts} />
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Paper>

                {/* Тайм-лайн выбранного дня */}
                {selectedDate && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography fontWeight={600}>
                        {selectedDate.split('-').reverse().join('.')}
                        {selectedSlot && (
                          <Typography component="span" variant="body2" color="text.secondary" ml={1}>
                            {selectedSlot.time_from.slice(0, 5)}–{selectedSlot.time_to.slice(0, 5)}
                          </Typography>
                        )}
                      </Typography>
                      {selectedSlot && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => setApptDialog({ open: true })}
                        >
                          Добавить запись
                        </Button>
                      )}
                    </Stack>
                    <Divider sx={{ mb: 2 }} />
                    {selectedSlot ? (
                      <DayTimeline
                        date={selectedDate}
                        slot={selectedSlot}
                        appointments={selectedAppointments}
                        onAddClick={(time) => setApptDialog({ open: true, prefillTime: time })}
                        onDelete={(id) => deleteApptMutation.mutate(id)}
                      />
                    ) : (
                      <DayTimelineEmpty date={selectedDate} />
                    )}
                  </Paper>
                )}
              </Stack>
            )}
          </Box>
        )}
      </Box>

      {/* ─── Диалоги ─────────────────────────────────────────────────────── */}

      <BreedFormDialog
        open={breedDialog.open}
        initial={breedDialog.breed}
        loading={createBreedMutation.isPending || updateBreedMutation.isPending}
        onClose={() => setBreedDialog({ open: false, breed: null })}
        onSubmit={handleBreedSubmit}
      />

      <ConfirmDialog
        open={!!deleteBreedTarget}
        title="Удалить породу"
        message={`Удалить «${deleteBreedTarget?.breed}»? Это действие нельзя отменить.`}
        confirmLabel="Удалить"
        loading={deleteBreedMutation.isPending}
        onConfirm={() => deleteBreedTarget && deleteBreedMutation.mutate(deleteBreedTarget.id)}
        onClose={() => setDeleteBreedTarget(null)}
      />

      {selectedDate && (
        <AppointmentFormDialog
          open={apptDialog.open}
          date={selectedDate}
          prefillTime={apptDialog.prefillTime}
          breeds={breeds}
          loading={createApptMutation.isPending}
          onClose={() => setApptDialog({ open: false })}
          onSubmit={handleApptSubmit}
        />
      )}
    </Layout>
  );
}
