import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  CircularProgress,
  Stack,
  Switch,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { getTemplate, upsertTemplateSlot, deleteTemplateSlot } from '../../../../data/source/grooming';
import { useNotification } from '../../../../shared/ui/Notification/NotificationContext';
import { DAY_NAMES_FULL } from '../../domain/types';
import type { GroomingTemplateSlot } from '../../domain/types';

// Порядок отображения: Пн=1, Вт=2, Ср=3, Чт=4, Пт=5, Сб=6, Вс=0
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function TemplateRow({
  dayOfWeek,
  slot,
  onToggle,
  onTimeChange,
  saving,
}: {
  dayOfWeek: number;
  slot: GroomingTemplateSlot | undefined;
  onToggle: (day: number, enabled: boolean) => void;
  onTimeChange: (day: number, field: 'time_from' | 'time_to', value: string) => void;
  saving: boolean;
}) {
  const enabled = !!slot;

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={{ xs: 1, sm: 2 }}
      sx={{
        py: 1.5,
        px: 2,
        borderRadius: 1,
        bgcolor: enabled ? 'action.hover' : 'transparent',
        transition: 'background-color 0.2s',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Switch
          checked={enabled}
          onChange={(e) => onToggle(dayOfWeek, e.target.checked)}
          disabled={saving}
          size="small"
        />
        <Typography
          sx={{ minWidth: { xs: 'auto', sm: 110 }, fontWeight: enabled ? 600 : 400, color: enabled ? 'text.primary' : 'text.disabled' }}
        >
          {DAY_NAMES_FULL[dayOfWeek]}
        </Typography>
      </Stack>
      {enabled ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            label="С"
            type="time"
            size="small"
            value={slot.time_from.slice(0, 5)}
            onChange={(e) => onTimeChange(dayOfWeek, 'time_from', e.target.value)}
            disabled={saving}
            slotProps={{ htmlInput: { step: 300, className: 'yv-no-spin' } }}
            sx={{ width: 130 }}
          />
          <Typography color="text.secondary">—</Typography>
          <TextField
            label="До"
            type="time"
            size="small"
            value={slot.time_to.slice(0, 5)}
            onChange={(e) => onTimeChange(dayOfWeek, 'time_to', e.target.value)}
            disabled={saving}
            slotProps={{ htmlInput: { step: 300, className: 'yv-no-spin' } }}
            sx={{ width: 130 }}
          />
        </Stack>
      ) : (
        <Typography variant="body2" color="text.disabled">
          Выходной
        </Typography>
      )}
    </Stack>
  );
}

export function WeeklyTemplate() {
  const { notify } = useNotification();
  const qc = useQueryClient();

  // Локальные значения времени для debounce
  const [localTimes, setLocalTimes] = useState<Record<number, { time_from: string; time_to: string }>>({});

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['grooming-template'],
    queryFn: getTemplate,
  });

  const upsertMutation = useMutation({
    mutationFn: upsertTemplateSlot,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grooming-template'] });
      notify('Шаблон сохранён', 'success');
    },
    onError: () => notify('Ошибка сохранения', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplateSlot,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grooming-template'] });
      notify('День удалён из шаблона', 'success');
    },
    onError: () => notify('Ошибка удаления', 'error'),
  });

  const slotsMap = Object.fromEntries(slots.map((s) => [s.day_of_week, s]));
  const saving = upsertMutation.isPending || deleteMutation.isPending;

  const handleToggle = (day: number, enabled: boolean) => {
    if (enabled) {
      upsertMutation.mutate({ day_of_week: day, time_from: '09:00', time_to: '18:00' });
    } else {
      deleteMutation.mutate(day);
      setLocalTimes((prev) => { const next = { ...prev }; delete next[day]; return next; });
    }
  };

  const handleTimeChange = (day: number, field: 'time_from' | 'time_to', value: string) => {
    const slot = slotsMap[day];
    if (!slot) return;

    const current = localTimes[day] ?? { time_from: slot.time_from.slice(0, 5), time_to: slot.time_to.slice(0, 5) };
    const updated = { ...current, [field]: value };
    setLocalTimes((prev) => ({ ...prev, [day]: updated }));

    // Сохраняем только если оба времени заполнены и from < to
    if (updated.time_from && updated.time_to && updated.time_from < updated.time_to) {
      upsertMutation.mutate({
        day_of_week: day,
        time_from: updated.time_from,
        time_to: updated.time_to,
      });
    }
  };

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Включите рабочие дни и задайте часы работы. Записи можно создавать только в рабочие часы.
      </Alert>
      <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
        {DISPLAY_ORDER.map((day) => {
          const slot = slotsMap[day];
          const localSlot = slot && localTimes[day]
            ? { ...slot, time_from: localTimes[day].time_from, time_to: localTimes[day].time_to }
            : slot;
          return (
            <TemplateRow
              key={day}
              dayOfWeek={day}
              slot={localSlot}
              onToggle={handleToggle}
              onTimeChange={handleTimeChange}
              saving={saving}
            />
          );
        })}
      </Stack>
    </Box>
  );
}
