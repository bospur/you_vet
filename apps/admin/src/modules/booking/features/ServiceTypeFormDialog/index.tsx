import { useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
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
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { NumericTextField } from '../../../../shared/ui/NumericTextField';
import type { BookingServiceType, BookingServiceTypeInput } from '../../../../data/source/booking';
import {
  buildBookingRules,
  DEFAULT_MAX_PER_DAY,
  parseBookingRules,
  rulesToFormFields,
} from '../../domain/bookingRules';
import {
  SCHEDULE_STYLE_LABELS,
  type ScheduleStyle,
} from '../../domain/scheduleStyle';

const schema = v.object({
  name: v.pipe(v.string(), v.minLength(1, 'Название обязательно')),
  category: v.picklist(['uzi', 'surgery', 'xray']),
  species_filter: v.picklist(['any', 'cats_only']),
  default_duration_min: v.pipe(v.number(), v.minValue(1, 'Минимум 1 минута')),
  booking_mode: v.picklist(['instant', 'pending_request']),
  schedule_style: v.picklist(['day_capacity', 'dropoff', 'time_slots']),
  seed_max_per_day: v.optional(v.pipe(v.number(), v.minValue(1))),
  instructions_client: v.string(),
  pet_age_collect: v.boolean(),
  pet_age_required: v.boolean(),
  pet_age_warn_years: v.pipe(v.number(), v.minValue(0)),
  pet_age_warn_message: v.string(),
  confirm_default: v.string(),
  reject_default: v.string(),
  max_per_service_date: v.pipe(v.number(), v.minValue(1)),
  max_per_day: v.pipe(v.number(), v.minValue(1)),
  is_active: v.boolean(),
  sort_order: v.number(),
});

type FormValues = {
  name: string;
  category: BookingServiceType['category'];
  species_filter: BookingServiceType['species_filter'];
  default_duration_min: number;
  booking_mode: BookingServiceType['booking_mode'];
  schedule_style: ScheduleStyle;
  seed_max_per_day?: number;
  instructions_client: string;
  pet_age_collect: boolean;
  pet_age_required: boolean;
  pet_age_warn_years: number;
  pet_age_warn_message: string;
  confirm_default: string;
  reject_default: string;
  max_per_service_date: number;
  max_per_day: number;
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
  const seed = values.seed_max_per_day;
  const capacityGroup = values.category === 'surgery' ? 'cat_surgery' : null;
  return {
    name: values.name.trim(),
    category: values.category,
    species_filter: values.species_filter,
    capacity_group: capacityGroup,
    default_duration_min: values.default_duration_min,
    booking_mode: values.booking_mode,
    schedule_style: values.schedule_style,
    seed_max_per_day: isCreate && seed && seed > 0 ? seed : undefined,
    instructions_client: values.instructions_client.trim() || null,
    rules: buildBookingRules({
      petAgeCollect: values.pet_age_collect,
      petAgeRequired: values.pet_age_required,
      petAgeWarnYears: values.pet_age_warn_years,
      petAgeWarnMessage: values.pet_age_warn_message,
      confirmDefault: values.confirm_default,
      rejectDefault: values.reject_default,
      maxPerServiceDate: values.max_per_service_date,
      maxPerDay: values.max_per_day,
    }),
    is_active: values.is_active,
    sort_order: values.sort_order,
  };
}

export function ServiceTypeFormDialog({ open, initial, loading, onClose, onSubmit }: Props) {
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: valibotResolver(schema),
    defaultValues: {
      name: '',
      category: 'uzi',
      species_filter: 'any',
      default_duration_min: 30,
      booking_mode: 'pending_request',
      schedule_style: 'day_capacity',
      seed_max_per_day: undefined,
      instructions_client: '',
      pet_age_collect: false,
      pet_age_required: false,
      pet_age_warn_years: 8,
      pet_age_warn_message: rulesToFormFields({}, 'day_capacity').petAgeWarnMessage,
      confirm_default: rulesToFormFields({}, 'day_capacity').confirmDefault,
      reject_default: rulesToFormFields({}, 'day_capacity').rejectDefault,
      max_per_service_date: 2,
      max_per_day: DEFAULT_MAX_PER_DAY,
      is_active: true,
      sort_order: 0,
    },
  });

  const category = useWatch({ control, name: 'category' });
  const scheduleStyle = useWatch({ control, name: 'schedule_style' });
  const petAgeCollect = useWatch({ control, name: 'pet_age_collect' });

  useEffect(() => {
    if (category === 'surgery') {
      setValue('schedule_style', 'dropoff');
      if (!initial) {
        setValue('seed_max_per_day', 10);
        setValue('pet_age_collect', true);
        setValue('pet_age_required', true);
        setValue('max_per_service_date', 3);
      }
    } else if (category === 'uzi' && !initial) {
      setValue('schedule_style', 'day_capacity');
      setValue('pet_age_collect', false);
      setValue('pet_age_required', false);
    }
  }, [category, setValue, initial]);

  useEffect(() => {
    if (scheduleStyle === 'time_slots') {
      setValue('max_per_service_date', 1);
    }
  }, [scheduleStyle, setValue]);

  useEffect(() => {
    if (open) {
      const style = (initial?.schedule_style ?? 'day_capacity') as ScheduleStyle;
      const ruleFields = rulesToFormFields(parseBookingRules(initial?.rules), style);
      reset(
        initial
          ? {
              name: initial.name,
              category: initial.category,
              species_filter: initial.species_filter,
              default_duration_min: initial.default_duration_min,
              booking_mode: initial.booking_mode,
              schedule_style: initial.schedule_style,
              seed_max_per_day: undefined,
              instructions_client: initial.instructions_client ?? '',
              ...ruleFields,
              is_active: initial.is_active,
              sort_order: initial.sort_order,
            }
          : {
              name: '',
              category: 'uzi',
              species_filter: 'any',
              default_duration_min: 30,
              booking_mode: 'pending_request',
              schedule_style: 'day_capacity',
              seed_max_per_day: undefined,
              instructions_client: '',
              ...ruleFields,
              pet_age_collect: false,
              pet_age_required: false,
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
          {!initial && category === 'surgery' && (
            <Controller
              name="seed_max_per_day"
              control={control}
              render={({ field }) => (
                <NumericTextField
                  value={field.value ?? ''}
                  onValueChange={(n) => field.onChange(n === '' ? undefined : n)}
                  label="Мест в день (шаблон Пн–Сб при создании)"
                  fullWidth
                  min={1}
                  helperText="Общий лимит кастрации и стерилизации на день. Дальше — в «Расписание»."
                />
              )}
            />
          )}
          {category === 'surgery' && (
            <Typography variant="caption" color="text.secondary" display="block">
              Операции кошек делят один дневной лимит (кастрация + стерилизация).
            </Typography>
          )}
          <Controller
            name="default_duration_min"
            control={control}
            render={({ field }) => (
              <NumericTextField
                value={field.value}
                onValueChange={field.onChange}
                label="Длительность (мин), ориентир"
                fullWidth
                min={1}
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
              <NumericTextField
                value={field.value}
                onValueChange={field.onChange}
                label="Порядок в списке"
                fullWidth
                allowEmpty={false}
              />
            )}
          />
          <Controller
            name="pet_age_collect"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={field.onChange} />}
                label="Спрашивать возраст питомца в Mini App"
              />
            )}
          />
          {petAgeCollect && (
            <>
              <Controller
                name="pet_age_required"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={field.onChange} />}
                    label="Возраст обязателен"
                  />
                )}
              />
              <Controller
                name="pet_age_warn_years"
                control={control}
                render={({ field }) => (
                  <NumericTextField
                    value={field.value}
                    onValueChange={field.onChange}
                    label="Предупреждение от (лет)"
                    fullWidth
                    min={0}
                    allowEmpty={false}
                  />
                )}
              />
              <Controller
                name="pet_age_warn_message"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Текст предупреждения о возрасте"
                    multiline
                    rows={2}
                    fullWidth
                  />
                )}
              />
            </>
          )}
          <Typography variant="subtitle2" sx={{ pt: 1 }}>
            Лимиты для клиента (Mini App)
          </Typography>
          <Controller
            name="max_per_service_date"
            control={control}
            render={({ field }) => (
              <NumericTextField
                value={field.value}
                onValueChange={field.onChange}
                label="Макс. заявок на эту услугу в один день"
                fullWidth
                min={1}
                allowEmpty={false}
                helperText="Разные клички — отдельные заявки. Для записи по времени обычно 1."
              />
            )}
          />
          <Controller
            name="max_per_day"
            control={control}
            render={({ field }) => (
              <NumericTextField
                value={field.value}
                onValueChange={field.onChange}
                label="Макс. заявок на все услуги в один день"
                fullWidth
                min={1}
                allowEmpty={false}
                helperText="Защита от злоупотреблений (по умолчанию 5)."
              />
            )}
          />
          <Controller
            name="confirm_default"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Сообщение клиенту при подтверждении (по умолчанию)"
                multiline
                rows={2}
                fullWidth
              />
            )}
          />
          <Controller
            name="reject_default"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Сообщение клиенту при отклонении (по умолчанию)"
                multiline
                rows={2}
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
