import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import * as v from 'valibot';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type { BookingServiceType, BookingServiceTypeInput } from '../../../../data/source/booking';
import {
  SCHEDULE_STYLE_LABELS,
  type ScheduleStyle,
} from '../../domain/scheduleStyle';

const schema = v.object({
  name: v.pipe(v.string(), v.minLength(1, 'Название обязательно')),
  category: v.picklist(['uzi', 'surgery', 'xray']),
  species_filter: v.picklist(['any', 'cats_only']),
  capacity_group: v.string(),
  default_duration_min: v.pipe(v.number(), v.minValue(1, 'Минимум 1 минута')),
  booking_mode: v.picklist(['instant', 'pending_request']),
  schedule_style: v.picklist(['day_capacity', 'dropoff', 'time_slots']),
  seed_max_per_day: v.optional(v.pipe(v.number(), v.minValue(1))),
  instructions_client: v.string(),
  is_active: v.boolean(),
  sort_order: v.number(),
});

type FormValues = {
  name: string;
  category: BookingServiceType['category'];
  species_filter: BookingServiceType['species_filter'];
  capacity_group: string;
  default_duration_min: number;
  booking_mode: BookingServiceType['booking_mode'];
  schedule_style: ScheduleStyle;
  seed_max_per_day?: number;
  instructions_client: string;
  is_active: boolean;
  sort_order: number;
};

interface Props {
  open: boolean;
  initial?: BookingServiceType | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: BookingServiceTypeInput) => void;
}

function toInput(values: FormValues, isCreate: boolean): BookingServiceTypeInput {
  const group = values.capacity_group.trim();
  const seed = values.seed_max_per_day;
  return {
    name: values.name.trim(),
    category: values.category,
    species_filter: values.species_filter,
    capacity_group: group === '' ? null : group,
    default_duration_min: values.default_duration_min,
    booking_mode: values.booking_mode,
    schedule_style: values.schedule_style,
    seed_max_per_day: isCreate && seed && seed > 0 ? seed : undefined,
    instructions_client: values.instructions_client.trim() || null,
    rules: [],
    is_active: values.is_active,
    sort_order: values.sort_order,
  };
}

export function ServiceTypeFormDialog({ open, initial, loading, onClose, onSubmit }: Props) {
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: valibotResolver(schema),
    defaultValues: {
      name: '',
      category: 'uzi',
      species_filter: 'any',
      capacity_group: '',
      default_duration_min: 30,
      booking_mode: 'pending_request',
      schedule_style: 'day_capacity',
      seed_max_per_day: undefined,
      instructions_client: '',
      is_active: true,
      sort_order: 0,
    },
  });

  const category = watch('category');
  const capacityGroup = watch('capacity_group');

  useEffect(() => {
    if (category === 'surgery') {
      if (!capacityGroup) setValue('capacity_group', 'cat_surgery');
      setValue('schedule_style', 'dropoff');
      if (!initial) setValue('seed_max_per_day', 10);
    } else if (category === 'uzi') {
      setValue('schedule_style', 'day_capacity');
    }
  }, [category, capacityGroup, setValue, initial]);

  useEffect(() => {
    if (open) {
      reset(
        initial
          ? {
              name: initial.name,
              category: initial.category,
              species_filter: initial.species_filter,
              capacity_group: initial.capacity_group ?? '',
              default_duration_min: initial.default_duration_min,
              booking_mode: initial.booking_mode,
              schedule_style: initial.schedule_style,
              seed_max_per_day: undefined,
              instructions_client: initial.instructions_client ?? '',
              is_active: initial.is_active,
              sort_order: initial.sort_order,
            }
          : {
              name: '',
              category: 'uzi',
              species_filter: 'any',
              capacity_group: '',
              default_duration_min: 30,
              booking_mode: 'pending_request',
              schedule_style: 'day_capacity',
              seed_max_per_day: undefined,
              instructions_client: '',
              is_active: true,
              sort_order: 0,
            },
      );
    }
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
      <DialogTitle>{initial ? 'Редактировать услугу' : 'Новая услуга'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Название" fullWidth autoFocus error={!!errors.name} helperText={errors.name?.message} />
            )}
          />
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <TextField {...field} select label="Категория" fullWidth>
                <MenuItem value="uzi">УЗИ</MenuItem>
                <MenuItem value="surgery">Операции</MenuItem>
                <MenuItem value="xray">Рентген</MenuItem>
              </TextField>
            )}
          />
          <Controller
            name="species_filter"
            control={control}
            render={({ field }) => (
              <TextField {...field} select label="Кого принимаем" fullWidth>
                <MenuItem value="any">Любые животные</MenuItem>
                <MenuItem value="cats_only">Только кошки</MenuItem>
              </TextField>
            )}
          />
          <Controller
            name="schedule_style"
            control={control}
            render={({ field }) => (
              <TextField {...field} select label="Тип расписания" fullWidth>
                {(Object.keys(SCHEDULE_STYLE_LABELS) as ScheduleStyle[]).map((key) => (
                  <MenuItem key={key} value={key}>{SCHEDULE_STYLE_LABELS[key]}</MenuItem>
                ))}
              </TextField>
            )}
          />
          {(capacityGroup || category === 'surgery') && !initial && (
            <Controller
              name="seed_max_per_day"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                  value={field.value ?? ''}
                  type="number"
                  label="Мест в день (шаблон Пн–Сб)"
                  fullWidth
                  inputProps={{ min: 1 }}
                  helperText={
                    capacityGroup
                      ? `Общий лимит для группы «${capacityGroup}» — настраивается в «Расписание»`
                      : 'Создаст шаблон недели при первом сохранении'
                  }
                />
              )}
            />
          )}
          <Controller
            name="capacity_group"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Группа общего лимита (необязательно)"
                fullWidth
                helperText="Для кастрации и стерилизации укажите cat_surgery — один лимит на день"
              />
            )}
          />
          <Controller
            name="default_duration_min"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
                type="number"
                label="Длительность (мин), ориентир"
                fullWidth
                inputProps={{ min: 1 }}
                error={!!errors.default_duration_min}
                helperText={errors.default_duration_min?.message}
              />
            )}
          />
          <Controller
            name="booking_mode"
            control={control}
            render={({ field }) => (
              <TextField {...field} select label="После заявки клиента" fullWidth>
                <MenuItem value="pending_request">Ждёт подтверждения (место резервируется)</MenuItem>
                <MenuItem value="instant">Сразу подтверждено</MenuItem>
              </TextField>
            )}
          />
          <Controller
            name="instructions_client"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Текст для клиента"
                multiline
                rows={3}
                fullWidth
                placeholder="Напр.: приносят с 12:00 до 13:00, забирают после 17:00"
              />
            )}
          />
          <Controller
            name="sort_order"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
                type="number"
                label="Порядок в списке"
                fullWidth
              />
            )}
          />
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={field.onChange} />}
                label="Показывать клиентам"
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Отмена</Button>
        <Button variant="contained" disabled={loading} onClick={handleSubmit((v) => onSubmit(toInput(v, !initial)))}>
          {initial ? 'Сохранить' : 'Создать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
