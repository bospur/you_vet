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
  Stack,
  TextField,
} from '@mui/material';
import type { GroomingBreed, GroomingBreedFormValues } from '../../domain/types';

const schema = v.object({
  breed: v.pipe(v.string(), v.minLength(1, 'Порода обязательна')),
  duration: v.pipe(
    v.number('Должно быть числом'),
    v.minValue(1, 'Минимум 1 минута'),
  ),
  price: v.string(),
  description: v.string(),
});

interface Props {
  open: boolean;
  initial?: GroomingBreed | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: GroomingBreedFormValues) => void;
}

export function BreedFormDialog({ open, initial, loading, onClose, onSubmit }: Props) {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<GroomingBreedFormValues>({
    resolver: valibotResolver(schema),
    defaultValues: { breed: '', duration: 60, price: '', description: '' },
  });

  useEffect(() => {
    if (open) {
      reset(
        initial
          ? {
              breed: initial.breed,
              duration: initial.duration,
              price: initial.price != null ? String(initial.price) : '',
              description: initial.description ?? '',
            }
          : { breed: '', duration: 60, price: '', description: '' },
      );
    }
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
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
            name="duration"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
                label="Время стрижки (мин)"
                type="number"
                fullWidth
                inputProps={{ min: 1 }}
                error={!!errors.duration}
                helperText={errors.duration?.message}
              />
            )}
          />
          <Controller
            name="price"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Стоимость (₽, необязательно)"
                type="number"
                fullWidth
                inputProps={{ min: 0, step: '0.01' }}
              />
            )}
          />
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Описание услуги"
                multiline
                rows={3}
                fullWidth
              />
            )}
          />
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
