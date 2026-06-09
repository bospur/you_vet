import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useBlocker } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import * as v from 'valibot';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Avatar, Box, Button, Chip, CircularProgress, Divider,
  FormControl, Grid, IconButton, InputLabel,
  MenuItem, Paper, Select, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PublishIcon from '@mui/icons-material/Publish';
import UnpublishedIcon from '@mui/icons-material/Unpublished';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { Layout } from '../../shared/ui/Layout';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { useNotification } from '../../shared/ui/Notification/NotificationContext';
import { useAuth } from '../../shared/config/AuthContext';
import {
  getDoctor, createDoctor, updateDoctor, updateDoctorStatus,
  uploadDoctorPhoto, getDoctorSchedule, addScheduleSlot, deleteScheduleSlot,
  getExceptions, upsertException, deleteException, addVacationRange,
} from '../../data/source/doctors';
import { prepareImageForUpload } from '../../shared/lib/prepareImageForUpload';
import { DAY_NAMES } from '../../modules/doctors/domain/types';
import type { DoctorScheduleSlot, DoctorScheduleException } from '../../modules/doctors/domain/types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

const schema = v.object({
  full_name: v.pipe(v.string(), v.minLength(1, 'ФИО обязательно')),
  specialty: v.string(),
  description: v.string(),
  contacts: v.string(),
  sort_order: v.number(),
});

type DoctorFormValues = v.InferOutput<typeof schema>;

export function DoctorEditorScreen() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<DoctorFormValues>({
    resolver: valibotResolver(schema),
    defaultValues: { full_name: '', specialty: '', description: '', contacts: '', sort_order: 0 },
  });
  const { formState: { errors, isDirty }, reset } = form;

  // ── Данные врача ────────────────────────────────────────────────────────────
  const { data: doctor, isLoading: doctorLoading } = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => getDoctor(Number(id)),
    enabled: isEdit,
  });

  const { data: schedule = [], isLoading: schedLoading } = useQuery({
    queryKey: ['doctor-schedule', id],
    queryFn: () => getDoctorSchedule(Number(id)),
    enabled: isEdit,
  });

  const { data: exceptions = [], isLoading: excLoading } = useQuery({
    queryKey: ['doctor-exceptions', id],
    queryFn: () => getExceptions(Number(id)),
    enabled: isEdit,
  });

  useEffect(() => {
    if (doctor) {
      reset({
        full_name: doctor.full_name,
        specialty: doctor.specialty,
        description: doctor.description,
        contacts: doctor.contacts,
        sort_order: doctor.sort_order,
      });
    }
  }, [doctor, reset]);

  // ── Сохранение формы ────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (values: DoctorFormValues) =>
      isEdit ? updateDoctor(Number(id), values) : createDoctor(values),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      reset(form.getValues());
      if (!isEdit) navigate(`/doctors/${saved.id}/edit`, { replace: true });
      notify('Сохранено', 'success');
    },
    onError: () => notify('Ошибка сохранения', 'error'),
  });

  // ── Публикация ──────────────────────────────────────────────────────────────
  const publishMutation = useMutation({
    mutationFn: () =>
      updateDoctorStatus(Number(id), doctor!.status === 'published' ? 'draft' : 'published'),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['doctor', id] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      reset(form.getValues());
      notify(updated.status === 'published' ? 'Опубликован' : 'Снят с публикации', 'success');
    },
    onError: () => notify('Ошибка', 'error'),
  });

  // ── Загрузка фото ───────────────────────────────────────────────────────────
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const photoMutation = useMutation({
    mutationFn: (file: File) => uploadDoctorPhoto(Number(id), file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', id] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      notify('Фото обновлено', 'success');
      setPhotoPreview(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: string } })?.response?.data;
      notify(typeof msg === 'string' && msg ? msg : 'Ошибка загрузки фото', 'error');
      setPhotoPreview(null);
    },
  });

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const prepared = await prepareImageForUpload(file);
      setPhotoPreview(URL.createObjectURL(prepared));
      photoMutation.mutate(prepared);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Не удалось обработать фото', 'error');
    }
  };

  // ── Слоты расписания ─────────────────────────────────────────────────────────
  const [newSlot, setNewSlot] = useState({ day_of_week: 1, time_from: '09:00', time_to: '18:00' });

  const addSlotMutation = useMutation({
    mutationFn: () => addScheduleSlot(Number(id), newSlot),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['doctor-schedule', id] }),
    onError: () => notify('Слот уже существует или неверные данные', 'error'),
  });

  const deleteSlotMutation = useMutation({
    mutationFn: (slotId: number) => deleteScheduleSlot(Number(id), slotId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['doctor-schedule', id] }),
    onError: () => notify('Ошибка удаления слота', 'error'),
  });

  // ── Отпуск ────────────────────────────────────────────────────────────────────
  const [vacation, setVacation] = useState({ date_from: '', date_to: '' });

  const vacationMutation = useMutation({
    mutationFn: () => addVacationRange(Number(id), vacation.date_from, vacation.date_to),
    onSuccess: (days) => {
      queryClient.invalidateQueries({ queryKey: ['doctor-exceptions', id] });
      setVacation({ date_from: '', date_to: '' });
      notify(`Отпуск добавлен (${days} дн.)`, 'success');
    },
    onError: () => notify('Ошибка добавления отпуска', 'error'),
  });

  // ── Исключения ────────────────────────────────────────────────────────────────
  const [newEx, setNewEx] = useState({ date: '', is_day_off: true, time_from: '', time_to: '' });
  const [exDeleteTarget, setExDeleteTarget] = useState<DoctorScheduleException | null>(null);

  const upsertExMutation = useMutation({
    mutationFn: () =>
      upsertException(Number(id), {
        date: newEx.date,
        is_day_off: newEx.is_day_off,
        time_from: newEx.is_day_off ? null : newEx.time_from || null,
        time_to: newEx.is_day_off ? null : newEx.time_to || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-exceptions', id] });
      setNewEx({ date: '', is_day_off: true, time_from: '', time_to: '' });
    },
    onError: () => notify('Ошибка сохранения исключения', 'error'),
  });

  const deleteExMutation = useMutation({
    mutationFn: (exId: number) => deleteException(Number(id), exId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-exceptions', id] });
      setExDeleteTarget(null);
    },
    onError: () => notify('Ошибка удаления', 'error'),
  });

  // ── Блокировка ухода при несохранённых изменениях ────────────────────────────
  useBlocker(isDirty && !saveMutation.isPending);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (isDirty) e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const isLoading = isEdit && (doctorLoading || schedLoading || excLoading);
  const isAdmin = user?.role === 'admin';
  const photoSrc = photoPreview ?? (doctor?.photo_url ? `${BASE_URL}${doctor.photo_url}` : undefined);

  if (isLoading) {
    return (
      <Layout title={isEdit ? 'Редактирование врача' : 'Новый врач'}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title={isEdit ? 'Редактирование врача' : 'Новый врач'}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/doctors')}><ArrowBackIcon /></IconButton>
        <Typography variant="h5" fontWeight={600} sx={{ flexGrow: 1 }}>
          {isEdit ? doctor?.full_name || 'Редактирование врача' : 'Новый врач'}
        </Typography>
        {isEdit && doctor && isAdmin && (
          <Chip
            label={doctor.status === 'published' ? 'Опубликован' : 'Черновик'}
            color={doctor.status === 'published' ? 'success' : 'default'}
            size="small"
          />
        )}
        {isEdit && isAdmin && (
          <Tooltip title={doctor?.status === 'published' ? 'Снять с публикации' : 'Опубликовать'}>
            <IconButton onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
              {doctor?.status === 'published' ? <UnpublishedIcon /> : <PublishIcon color="success" />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* ── Основная информация ── */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>Основная информация</Typography>
            <Stack spacing={2}>
              <TextField
                label="ФИО *"
                fullWidth
                {...form.register('full_name')}
                error={!!errors.full_name}
                helperText={errors.full_name?.message}
              />
              <TextField
                label="Специализация"
                fullWidth
                {...form.register('specialty')}
              />
              <TextField
                label="Описание"
                fullWidth
                multiline
                rows={4}
                {...form.register('description')}
              />
              <TextField
                label="Контакты"
                fullWidth
                multiline
                rows={2}
                placeholder="Телефон, email и т.д."
                {...form.register('contacts')}
              />
              <TextField
                label="Порядок сортировки"
                type="number"
                sx={{ width: 200 }}
                {...form.register('sort_order', { valueAsNumber: true })}
              />
            </Stack>
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={form.handleSubmit((v) => saveMutation.mutate(v))}
                disabled={saveMutation.isPending || !isDirty}
              >
                {saveMutation.isPending ? 'Сохранение…' : 'Сохранить'}
              </Button>
              <Button variant="outlined" onClick={() => navigate('/doctors')}>Отмена</Button>
            </Box>
          </Paper>
        </Grid>

        {/* ── Фото ── */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>Фото</Typography>
            <Avatar src={photoSrc} sx={{ width: 120, height: 120, mx: 'auto', mb: 2, fontSize: 48 }}>
              {doctor?.full_name?.[0] ?? '?'}
            </Avatar>
            {isEdit && (
              <>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                  ref={photoInputRef}
                  style={{ display: 'none' }}
                  onChange={handlePhotoChange}
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PhotoCameraIcon />}
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoMutation.isPending}
                >
                  {photoMutation.isPending ? 'Загрузка…' : 'Загрузить фото'}
                </Button>
                <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                  JPG, PNG, WebP · до 5 МБ
                </Typography>
              </>
            )}
            {!isEdit && (
              <Typography variant="caption" color="text.secondary">
                Фото можно загрузить после сохранения
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* ── Расписание (только для существующего врача) ── */}
        {isEdit && (
          <Grid size={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Еженедельное расписание</Typography>

              {/* Существующие слоты */}
              <Stack spacing={1} mb={2}>
                {schedule.length === 0 && (
                  <Typography variant="body2" color="text.secondary">Расписание не задано</Typography>
                )}
                {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                  const slots = schedule.filter((s: DoctorScheduleSlot) => s.day_of_week === day);
                  if (!slots.length) return null;
                  return (
                    <Box key={day}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {DAY_NAMES[day]}
                      </Typography>
                      {slots.map((s: DoctorScheduleSlot) => (
                        <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 2 }}>
                          <Typography variant="body2">{s.time_from.slice(0, 5)} – {s.time_to.slice(0, 5)}</Typography>
                          <IconButton size="small" color="error" onClick={() => deleteSlotMutation.mutate(s.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  );
                })}
              </Stack>

              <Divider sx={{ my: 2 }} />

              {/* Форма добавления слота */}
              <Typography variant="body2" fontWeight={600} mb={1}>Добавить слот</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <FormControl size="small" sx={{ minWidth: 110 }}>
                  <InputLabel>День</InputLabel>
                  <Select
                    label="День"
                    value={newSlot.day_of_week}
                    onChange={(e) => setNewSlot((s) => ({ ...s, day_of_week: Number(e.target.value) }))}
                  >
                    {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                      <MenuItem key={d} value={d}>{DAY_NAMES[d]}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Начало"
                  type="time"
                  size="small"
                  value={newSlot.time_from}
                  onChange={(e) => setNewSlot((s) => ({ ...s, time_from: e.target.value }))}
                  sx={{ width: 130 }}
                />
                <TextField
                  label="Конец"
                  type="time"
                  size="small"
                  value={newSlot.time_to}
                  onChange={(e) => setNewSlot((s) => ({ ...s, time_to: e.target.value }))}
                  sx={{ width: 130 }}
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => addSlotMutation.mutate()}
                  disabled={addSlotMutation.isPending}
                >
                  Добавить
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* ── Отпуск (только для существующего врача) ── */}
        {isEdit && (
          <Grid size={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>Отпуск</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Врач не будет отображаться в расписании на выбранные даты.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <TextField
                  label="С"
                  type="date"
                  size="small"
                  value={vacation.date_from}
                  onChange={(e) => setVacation((s) => ({ ...s, date_from: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ width: 160 }}
                />
                <TextField
                  label="По"
                  type="date"
                  size="small"
                  value={vacation.date_to}
                  onChange={(e) => setVacation((s) => ({ ...s, date_to: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ width: 160 }}
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => vacationMutation.mutate()}
                  disabled={
                    !vacation.date_from
                    || !vacation.date_to
                    || vacation.date_to < vacation.date_from
                    || vacationMutation.isPending
                  }
                >
                  {vacationMutation.isPending ? 'Сохранение…' : 'Добавить отпуск'}
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* ── Исключения (только для существующего врача) ── */}
        {isEdit && (
          <Grid size={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Исключения на день</Typography>

              <Stack spacing={1} mb={2}>
                {exceptions.length === 0 && (
                  <Typography variant="body2" color="text.secondary">Исключений нет</Typography>
                )}
                {exceptions.map((ex: DoctorScheduleException) => (
                  <Box key={ex.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" sx={{ minWidth: 110 }}>{ex.date}</Typography>
                    {ex.is_day_off ? (
                      <Chip size="small" label="Отпуск / выходной" color="warning" />
                    ) : (
                      <Typography variant="body2">
                        {ex.time_from?.slice(0, 5)} – {ex.time_to?.slice(0, 5)}
                      </Typography>
                    )}
                    <IconButton size="small" color="error" onClick={() => setExDeleteTarget(ex)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" fontWeight={600} mb={1}>Добавить исключение</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <TextField
                  label="Дата"
                  type="date"
                  size="small"
                  value={newEx.date}
                  onChange={(e) => setNewEx((s) => ({ ...s, date: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ width: 160 }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Тип</InputLabel>
                  <Select
                    label="Тип"
                    value={newEx.is_day_off ? 'off' : 'custom'}
                    onChange={(e) => setNewEx((s) => ({ ...s, is_day_off: e.target.value === 'off' }))}
                  >
                    <MenuItem value="off">Выходной</MenuItem>
                    <MenuItem value="custom">Другое время</MenuItem>
                  </Select>
                </FormControl>
                {!newEx.is_day_off && (
                  <>
                    <TextField
                      label="Начало"
                      type="time"
                      size="small"
                      value={newEx.time_from}
                      onChange={(e) => setNewEx((s) => ({ ...s, time_from: e.target.value }))}
                      sx={{ width: 130 }}
                    />
                    <TextField
                      label="Конец"
                      type="time"
                      size="small"
                      value={newEx.time_to}
                      onChange={(e) => setNewEx((s) => ({ ...s, time_to: e.target.value }))}
                      sx={{ width: 130 }}
                    />
                  </>
                )}
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => upsertExMutation.mutate()}
                  disabled={!newEx.date || upsertExMutation.isPending}
                >
                  Добавить
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>

      <ConfirmDialog
        open={!!exDeleteTarget}
        title="Удалить исключение?"
        message={`Исключение на ${exDeleteTarget?.date} будет удалено.`}
        loading={deleteExMutation.isPending}
        onConfirm={() => exDeleteTarget && deleteExMutation.mutate(exDeleteTarget.id)}
        onClose={() => setExDeleteTarget(null)}
      />
    </Layout>
  );
}
