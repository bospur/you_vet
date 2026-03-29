import { useState } from 'react';
import { Controller } from 'react-hook-form';
import {
  Box, Button, ButtonBase, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, FormHelperText, InputLabel,
  MenuItem, Popover, Select, Stack, TextField, Typography,
} from '@mui/material';
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react';
import type { Animal } from '../../../animals/domain/types';
import type { CategoryRow } from '../../domain/types';
import { useCategoryFormDialogLogic } from './useLogic';

interface CategoryFormDialogProps {
  open: boolean;
  category: CategoryRow | null;
  animals: Animal[];
  onClose: () => void;
}

export function CategoryFormDialog({ open, category, animals, onClose }: CategoryFormDialogProps) {
  const { form, onSubmit, isEdit, loading } = useCategoryFormDialogLogic({ category, onClose });
  const { control, formState: { errors }, setValue, watch } = form;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const iconValue = watch('icon');

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setValue('icon', emojiData.emoji, { shouldValidate: true });
    setAnchorEl(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Редактировать категорию' : 'Добавить категорию'}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>

          {/* Животное */}
          <Controller
            name="animal_id"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.animal_id}>
                <InputLabel>Животное</InputLabel>
                <Select {...field} label="Животное" value={field.value || ''}>
                  {animals.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.icon && <span style={{ marginRight: 8 }}>{a.icon}</span>}
                      {a.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.animal_id && (
                  <FormHelperText>{errors.animal_id.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />

          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Название"
                fullWidth
                autoFocus
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            )}
          />

          <Controller
            name="slug"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Slug"
                fullWidth
                placeholder="pervaya-pomoshch"
                error={!!errors.slug}
                helperText={errors.slug?.message ?? 'Строчные латинские буквы, цифры, дефис'}
              />
            )}
          />

          {/* Emoji picker */}
          <Box>
            <InputLabel sx={{ mb: 0.75, fontSize: '0.875rem' }}>Иконка</InputLabel>
            <ButtonBase
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                width: '100%',
                border: '1px solid',
                borderColor: errors.icon ? 'error.main' : 'divider',
                borderRadius: 2,
                p: 1.5,
                justifyContent: 'flex-start',
                gap: 1.5,
                '&:hover': { borderColor: 'text.primary', bgcolor: 'action.hover' },
              }}
            >
              <Typography sx={{ fontSize: '2rem', lineHeight: 1 }}>{iconValue || '➕'}</Typography>
              <Typography color={iconValue ? 'text.primary' : 'text.secondary'}>
                {iconValue ? 'Иконка выбрана — нажмите чтобы изменить' : 'Нажмите чтобы выбрать эмодзи'}
              </Typography>
            </ButtonBase>
          </Box>

          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <EmojiPicker onEmojiClick={handleEmojiClick} theme={Theme.LIGHT} searchPlaceholder="Поиск эмодзи..." lazyLoadEmojis />
          </Popover>

          <Controller
            name="sort_order"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
                label="Порядок сортировки"
                type="number"
                fullWidth
                error={!!errors.sort_order}
                helperText={errors.sort_order?.message}
              />
            )}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Отмена</Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
