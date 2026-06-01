import { Controller } from 'react-hook-form';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useLoginFormLogic } from './useLogic';
import { styles } from './styles';

export function LoginForm() {
  const { form, onSubmit, loading } = useLoginFormLogic();
  const { control, formState: { errors } } = form;

  return (
    <Paper sx={styles.card}>
      <Typography variant="h5" color="primary" sx={styles.title}>
        VP Admin
      </Typography>

      <Box component="form" onSubmit={onSubmit} noValidate>
        <Controller
          name="login"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Логин"
              fullWidth
              autoComplete="username"
              autoFocus
              error={!!errors.login}
              helperText={errors.login?.message}
              sx={styles.field}
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Пароль"
              type="password"
              fullWidth
              autoComplete="current-password"
              error={!!errors.password}
              helperText={errors.password?.message}
              sx={styles.field}
            />
          )}
        />

        <Controller
          name="rememberMe"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              sx={styles.remember}
              control={
                <Checkbox
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              }
              label="Запомнить меня"
            />
          )}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={styles.submitBtn}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {loading ? 'Вход...' : 'Войти'}
        </Button>
      </Box>
    </Paper>
  );
}
