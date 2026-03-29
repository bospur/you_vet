import { useMemo } from 'react';
import { Box, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { GroomingAppointment, GroomingTemplateSlot } from '../../domain/types';

const PX_PER_MIN = 2; // 2px на минуту → 1 час = 120px
const LABEL_WIDTH = 48; // ширина колонки с временем
const SLOT_STEP_MIN = 30; // шаг меток на сетке

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(total: number): string {
  const h = Math.floor(total / 60).toString().padStart(2, '0');
  const m = (total % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

interface AppointmentBlockProps {
  appointment: GroomingAppointment;
  offsetTop: number;
  height: number;
  onDelete: (id: number) => void;
}

function AppointmentBlock({ appointment, offsetTop, height, onDelete }: AppointmentBlockProps) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: offsetTop,
        left: 0,
        right: 8,
        height: Math.max(height, 28),
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        borderRadius: 1,
        px: 1,
        py: 0.5,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        overflow: 'hidden',
        cursor: 'default',
        boxShadow: 1,
        zIndex: 1,
      }}
    >
      <Box sx={{ overflow: 'hidden', minWidth: 0 }}>
        <Typography variant="caption" fontWeight={700} noWrap display="block">
          {appointment.start_time.slice(0, 5)}–{appointment.end_time.slice(0, 5)} {appointment.pet_name}
        </Typography>
        <Typography variant="caption" noWrap display="block" sx={{ opacity: 0.85 }}>
          {appointment.breed}
          {appointment.owner_phone ? ` · ${appointment.owner_phone}` : ''}
        </Typography>
      </Box>
      <Tooltip title="Удалить запись">
        <IconButton
          size="small"
          sx={{ color: 'inherit', opacity: 0.7, flexShrink: 0, p: 0.25, mt: 0.25 }}
          onClick={() => onDelete(appointment.id)}
        >
          <DeleteIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

interface EmptySlotProps {
  offsetTop: number;
  height: number;
  time: string;
  onClick: (time: string) => void;
}

function EmptySlotHover({ offsetTop, height, time, onClick }: EmptySlotProps) {
  return (
    <Box
      onClick={() => onClick(time)}
      sx={{
        position: 'absolute',
        top: offsetTop,
        left: 0,
        right: 8,
        height,
        cursor: 'pointer',
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0,
        '&:hover': {
          opacity: 1,
          bgcolor: 'action.hover',
          border: '1px dashed',
          borderColor: 'primary.main',
        },
        transition: 'opacity 0.15s',
        zIndex: 0,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <AddIcon sx={{ fontSize: 14, color: 'primary.main' }} />
        <Typography variant="caption" color="primary.main">{time}</Typography>
      </Stack>
    </Box>
  );
}

interface Props {
  date: string;
  slot: GroomingTemplateSlot;
  appointments: GroomingAppointment[];
  onAddClick: (time: string) => void;
  onDelete: (id: number) => void;
}

export function DayTimeline({ slot, appointments, onAddClick, onDelete }: Props) {
  const startMin = timeToMinutes(slot.time_from.slice(0, 5));
  const endMin = timeToMinutes(slot.time_to.slice(0, 5));
  const totalMin = endMin - startMin;
  const totalHeight = totalMin * PX_PER_MIN;

  // Временны́е метки каждые 30 минут
  const timeLabels = useMemo(() => {
    const labels: number[] = [];
    for (let m = startMin; m <= endMin; m += SLOT_STEP_MIN) {
      labels.push(m);
    }
    return labels;
  }, [startMin, endMin]);

  // Пустые слоты (для hover-зон) — каждые 30 минут, не перекрытые записями
  const emptySlots = useMemo(() => {
    const slots: { start: number; end: number }[] = [];
    for (let m = startMin; m < endMin; m += SLOT_STEP_MIN) {
      const slotEnd = Math.min(m + SLOT_STEP_MIN, endMin);
      const overlaps = appointments.some((a) => {
        const aStart = timeToMinutes(a.start_time.slice(0, 5));
        const aEnd = timeToMinutes(a.end_time.slice(0, 5));
        return aStart < slotEnd && aEnd > m;
      });
      if (!overlaps) slots.push({ start: m, end: slotEnd });
    }
    return slots;
  }, [startMin, endMin, appointments]);

  return (
    <Box sx={{ display: 'flex', gap: 0 }}>
      {/* Колонка времени */}
      <Box sx={{ width: LABEL_WIDTH, flexShrink: 0, position: 'relative', height: totalHeight }}>
        {timeLabels.map((m) => (
          <Typography
            key={m}
            variant="caption"
            color="text.disabled"
            sx={{
              position: 'absolute',
              top: (m - startMin) * PX_PER_MIN - 8,
              right: 8,
              userSelect: 'none',
              lineHeight: 1,
            }}
          >
            {minutesToTime(m)}
          </Typography>
        ))}
      </Box>

      {/* Основная область */}
      <Box sx={{ flex: 1, position: 'relative', height: totalHeight }}>
        {/* Линии сетки */}
        {timeLabels.map((m) => (
          <Box
            key={m}
            sx={{
              position: 'absolute',
              top: (m - startMin) * PX_PER_MIN,
              left: 0,
              right: 8,
              borderTop: '1px solid',
              borderColor: m % 60 === 0 ? 'divider' : 'action.selected',
            }}
          />
        ))}

        {/* Пустые hover-слоты */}
        {emptySlots.map((s) => (
          <EmptySlotHover
            key={s.start}
            offsetTop={(s.start - startMin) * PX_PER_MIN}
            height={(s.end - s.start) * PX_PER_MIN}
            time={minutesToTime(s.start)}
            onClick={onAddClick}
          />
        ))}

        {/* Записи */}
        {appointments.map((appt) => {
          const apptStart = timeToMinutes(appt.start_time.slice(0, 5));
          const apptEnd = timeToMinutes(appt.end_time.slice(0, 5));
          return (
            <AppointmentBlock
              key={appt.id}
              appointment={appt}
              offsetTop={(apptStart - startMin) * PX_PER_MIN}
              height={(apptEnd - apptStart) * PX_PER_MIN}
              onDelete={onDelete}
            />
          );
        })}
      </Box>
    </Box>
  );
}

// Компонент-заглушка когда день нерабочий
export function DayTimelineEmpty({ date }: { date: string }) {
  const [y, m, d] = date.split('-');
  return (
    <Box sx={{ py: 6, textAlign: 'center' }}>
      <Typography color="text.secondary">
        {d}.{m}.{y} — нерабочий день
      </Typography>
      <Typography variant="caption" color="text.disabled">
        Добавьте этот день в шаблон недели, чтобы создавать записи
      </Typography>
    </Box>
  );
}

// Мини-индикатор для ячейки календаря
export function DayAppointmentBadges({ appointments }: { appointments: GroomingAppointment[] }) {
  if (appointments.length === 0) return null;
  return (
    <Stack direction="row" flexWrap="wrap" spacing={0.5} justifyContent="center" mt={0.5} useFlexGap>
      {appointments.slice(0, 3).map((a) => (
        <Chip key={a.id} label={a.start_time.slice(0, 5)} size="small" sx={{ fontSize: 10, height: 18 }} />
      ))}
      {appointments.length > 3 && (
        <Chip label={`+${appointments.length - 3}`} size="small" sx={{ fontSize: 10, height: 18 }} />
      )}
    </Stack>
  );
}
