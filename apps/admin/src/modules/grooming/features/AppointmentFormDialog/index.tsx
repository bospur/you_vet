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
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { GroomingBreed } from '../../domain/types';
import { breedServiceLabel, formatPriceRange } from '../../domain/formatPrice';

const schema = v.object({
  breed_id: v.pipe(v.number(), v.minValue(1, 'Выберите породу')),
  pet_name: v.pipe(v.string(), v.minLength(1, 'Кличка обязательна')),
  owner_phone: v.string(),
  start_time: v.pipe(v.string(), v.minLength(1, 'Время обязательно')),
});

interface FormValues {
  breed_id: number;
  pet_name: string;
  owner_phone: string;
  start_time: string;
}

interface Props {
  open: boolean;
  date: string;        // 'YYYY-MM-DD'
  prefillTime?: string; // предзаполненное время из клика на сетке
  breeds: GroomingBreed[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: FormValues & { date: string }) => void;
}

export function AppointmentFormDialog({ open, date, prefillTime, breeds, loading, onClose, onSubmit }: Props) {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: valibotResolver(schema),
    defaultValues: { breed_id: 0, pet_name: '', owner_phone: '', start_time: '' },
  });

  const selectedBreedId = useWatch({ control, name: 'breed_id' });
  const selectedBreed = breeds.find((b) => b.id === selectedBreedId);
  const multiService = breeds.some(
    (b) => b.breed === selectedBreed?.breed && b.id !== selectedBreed?.id,
  );

  useEffect(() => {
    if (open) {
      reset({ breed_id: 0, pet_name: '', owner_phone: '', start_time: prefillTime ?? '' });
    }
  }, [open, prefillTime, reset]);

  const handleFormSubmit = (values: FormValues) => {
    onSubmit({ ...values, date });
  };

  const formatDate = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${day}.${m}.${y}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Новая запись — {formatDate(date)}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Controller
            name="breed_id"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Порода"
                fullWidth
                error={!!errors.breed_id}
                helperText={errors.breed_id?.message}
                onChange={(e) => field.onChange(Number(e.target.value))}
              >
                <MenuItem value={0} disabled>Выберите услугу</MenuItem>
                {breeds.map((b) => {
                  const showType = breeds.filter((x) => x.breed === b.breed).length > 1;
                  return (
                    <MenuItem key={b.id} value={b.id}>
                      {breedServiceLabel(b, showType)} · {b.duration} мин
                      {' · '}
                      {formatPriceRange(b.price_from, b.price_to)}
                    </MenuItem>
                  );
                })}
              </TextField>
            )}
          />
          {selectedBreed && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
              {multiService ? `${selectedBreed.service_name}: ` : ''}
              {selectedBreed.duration} мин · {formatPriceRange(selectedBreed.price_from, selectedBreed.price_to)}
              {selectedBreed.description ? ` · ${selectedBreed.description}` : ''}
            </Typography>
          )}
          <Controller
            name="start_time"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Начало приёма"
                type="time"
                fullWidth
                slotProps={{ htmlInput: { step: 300, className: 'yv-no-spin' } }}
                error={!!errors.start_time}
                helperText={errors.start_time?.message}
              />
            )}
          />
          <Controller
            name="pet_name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Кличка питомца"
                fullWidth
                error={!!errors.pet_name}
                helperText={errors.pet_name?.message}
              />
            )}
          />
          <Controller
            name="owner_phone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Телефон хозяина"
                type="tel"
                fullWidth
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Отмена</Button>
        <Button variant="contained" onClick={handleSubmit(handleFormSubmit)} disabled={loading}>
          Записать
        </Button>
      </DialogActions>
    </Dialog>
  );
}
