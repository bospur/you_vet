import { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import * as v from 'valibot';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { NumericTextField } from '../../../../shared/ui/NumericTextField';
import type { GroomingBreedGroup, GroomingBreedGroupFormValues } from '../../domain/types';

const serviceSchema = v.object({
  service_name: v.pipe(v.string(), v.minLength(1, 'Укажите тип услуги')),
  duration: v.pipe(
    v.number('Укажите время'),
    v.minValue(1, 'Минимум 1 минута'),
  ),
  price_from: v.string(),
  price_to: v.string(),
});

const schema = v.object({
  breed: v.pipe(v.string(), v.minLength(1, 'Порода обязательна')),
  description: v.string(),
  services: v.pipe(v.array(serviceSchema), v.minLength(1, 'Добавьте хотя бы один тип услуги')),
});

const emptyService = (): GroomingBreedGroupFormValues['services'][0] => ({
  service_name: 'Стрижка',
  duration: 60,
  price_from: '',
  price_to: '',
});

interface Props {
  open: boolean;
  initial?: GroomingBreedGroup | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: GroomingBreedGroupFormValues) => void;
}

export function BreedFormDialog({ open, initial, loading, onClose, onSubmit }: Props) {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<GroomingBreedGroupFormValues>({
    resolver: valibotResolver(schema),
    defaultValues: { breed: '', description: '', services: [emptyService()] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'services' });

  useEffect(() => {
    if (!open) return;
    if (initial) {
      reset({
        breed: initial.breed,
        description: initial.description ?? '',
        services: initial.services.map((s) => ({
          service_name: s.service_name || 'Стрижка',
          duration: s.duration,
          price_from: s.price_from != null ? String(s.price_from) : '',
          price_to: s.price_to != null ? String(s.price_to) : '',
        })),
      });
    } else {
      reset({ breed: '', description: '', services: [emptyService()] });
    }
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial ? 'Редактировать породу' : 'Новая порода'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Controller
            name="breed"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Порода"
                fullWidth
                autoFocus
                error={!!errors.breed}
                helperText={errors.breed?.message}
              />
            )}
          />
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Описание (общее, необязательно)"
                multiline
                rows={2}
                fullWidth
              />
            )}
          />

          <Typography variant="subtitle2" color="text.secondary">
            Типы услуг (стрижка, триминг и т.д.)
          </Typography>

          {fields.map((field, index) => (
            <Stack
              key={field.id}
              spacing={1.5}
              sx={{ p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="body2" fontWeight={600}>
                  Услуга {index + 1}
                </Typography>
                {fields.length > 1 && (
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="Удалить услугу"
                    onClick={() => remove(index)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
              <Controller
                name={`services.${index}.service_name`}
                control={control}
                render={({ field: f }) => (
                  <TextField
                    {...f}
                    label="Тип услуги"
                    placeholder="Стрижка, триминг…"
                    fullWidth
                    size="small"
                    error={!!errors.services?.[index]?.service_name}
                    helperText={errors.services?.[index]?.service_name?.message}
                  />
                )}
              />
              <Controller
                name={`services.${index}.duration`}
                control={control}
                render={({ field: f }) => (
                  <NumericTextField
                    label="Время (мин)"
                    fullWidth
                    size="small"
                    min={1}
                    allowEmpty={false}
                    value={f.value}
                    onValueChange={f.onChange}
                    error={!!errors.services?.[index]?.duration}
                    helperText={errors.services?.[index]?.duration?.message}
                  />
                )}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Controller
                  name={`services.${index}.price_from`}
                  control={control}
                  render={({ field: f }) => (
                    <TextField
                      {...f}
                      label="Цена от (₽)"
                      fullWidth
                      size="small"
                      inputMode="decimal"
                      onChange={(e) => {
                        const raw = e.target.value.replace(',', '.');
                        if (raw === '' || /^\d*(\.\d{0,2})?$/.test(raw)) f.onChange(raw);
                      }}
                      slotProps={{ htmlInput: { className: 'yv-no-spin' } }}
                    />
                  )}
                />
                <Controller
                  name={`services.${index}.price_to`}
                  control={control}
                  render={({ field: f }) => (
                    <TextField
                      {...f}
                      label="Цена до (₽)"
                      fullWidth
                      size="small"
                      inputMode="decimal"
                      onChange={(e) => {
                        const raw = e.target.value.replace(',', '.');
                        if (raw === '' || /^\d*(\.\d{0,2})?$/.test(raw)) f.onChange(raw);
                      }}
                      slotProps={{ htmlInput: { className: 'yv-no-spin' } }}
                    />
                  )}
                />
              </Stack>
            </Stack>
          ))}

          {errors.services?.message && (
            <Typography variant="caption" color="error">
              {errors.services.message}
            </Typography>
          )}

          <Button
            startIcon={<AddIcon />}
            size="small"
            onClick={() => append(emptyService())}
            sx={{ alignSelf: 'flex-start' }}
          >
            Добавить тип услуги
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Отмена</Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={loading}>
          {initial ? 'Сохранить' : 'Создать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
