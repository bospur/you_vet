import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, IconButton, InputAdornment,
  InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
  useMediaQuery, useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useForm, Controller } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import * as v from 'valibot';
import { Layout } from '../../shared/ui/Layout';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { getUsers, createUser, deleteUser } from '../../data/source/users';
import { useNotification } from '../../shared/ui/Notification/NotificationContext';
import { useAuth } from '../../shared/config/AuthContext';
import type { User } from '../../data/source/users';

const schema = v.object({
  login: v.pipe(v.string(), v.minLength(1, 'Введите логин')),
  password: v.pipe(v.string(), v.minLength(6, 'Минимум 6 символов')),
  role: v.union([v.literal('admin'), v.literal('editor'), v.literal('groomer'), v.literal('manager')]),
});

type FormValues = { login: string; password: string; role: 'admin' | 'editor' | 'groomer' | 'manager' };

function generatePassword(length = 8): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

const roleChip = (role: User['role']) => {
  if (role === 'admin') return <Chip label="Админ" size="small" color="primary" variant="outlined" />;
  if (role === 'groomer') return <Chip label="Грумер" size="small" color="secondary" variant="outlined" />;
  if (role === 'manager') return <Chip label="Менеджер" size="small" color="info" variant="outlined" />;
  return <Chip label="Редактор" size="small" variant="outlined" />;
};

export function UsersScreen() {
  const { notify } = useNotification();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const form = useForm<FormValues>({
    resolver: valibotResolver(schema),
    defaultValues: { login: '', password: '', role: 'editor' },
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notify('Пользователь создан', 'success');
      setDialogOpen(false);
      form.reset();
    },
    onError: () => notify('Логин уже занят или ошибка сервера', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notify('Пользователь удалён', 'success');
      setDeleteTarget(null);
    },
    onError: () => notify('Ошибка удаления', 'error'),
  });

  const handleOpenCreate = () => {
    form.reset({ login: '', password: generatePassword(), role: 'editor' });
    setDialogOpen(true);
  };

  const handleGeneratePassword = () => {
    form.setValue('password', generatePassword(), { shouldValidate: true, shouldDirty: true });
  };

  const handleCopyPassword = async () => {
    const password = form.getValues('password');
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      notify('Пароль скопирован', 'success');
    } catch {
      notify('Не удалось скопировать', 'error');
    }
  };

  return (
    <Layout title="Пользователи">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>Пользователи</Typography>
        {isMobile ? (
          <Tooltip title="Добавить">
            <IconButton color="primary" onClick={handleOpenCreate}><AddIcon /></IconButton>
          </Tooltip>
        ) : (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Добавить
          </Button>
        )}
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {users.map((u) => (
            <Paper key={u.id} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography fontWeight={600}>{u.login}</Typography>
                <Box sx={{ mt: 0.5 }}>{roleChip(u.role)}</Box>
              </Box>
              {u.id !== currentUser?.id && (
                <Tooltip title="Удалить">
                  <IconButton size="small" color="error" onClick={() => setDeleteTarget(u)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Paper>
          ))}
        </Box>
      ) : (
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Логин', 'Роль', ''].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>{u.login}</TableCell>
                    <TableCell>{roleChip(u.role)}</TableCell>
                    <TableCell width={60}>
                      {u.id !== currentUser?.id && (
                        <Tooltip title="Удалить">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(u)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Диалог создания */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Новый пользователь</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Controller
              name="login"
              control={form.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Логин"
                  fullWidth
                  autoFocus
                  error={!!form.formState.errors.login}
                  helperText={form.formState.errors.login?.message}
                />
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Пароль"
                  type="text"
                  fullWidth
                  autoComplete="new-password"
                  error={!!form.formState.errors.password}
                  helperText={form.formState.errors.password?.message ?? '6–8 символов, можно сгенерировать'}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Сгенерировать">
                            <IconButton size="small" onClick={handleGeneratePassword} edge="end">
                              <RefreshIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Скопировать">
                            <IconButton size="small" onClick={handleCopyPassword} edge="end" disabled={!field.value}>
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              )}
            />
            <Controller
              name="role"
              control={form.control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Роль</InputLabel>
                  <Select {...field} label="Роль">
                    <MenuItem value="editor">Редактор</MenuItem>
                    <MenuItem value="groomer">Грумер</MenuItem>
                    <MenuItem value="manager">Менеджер (запись)</MenuItem>
                    <MenuItem value="admin">Админ</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setDialogOpen(false); form.reset(); }}>Отмена</Button>
          <Button
            variant="contained"
            disabled={createMutation.isPending}
            onClick={form.handleSubmit((v) => createMutation.mutate(v))}
          >
            {createMutation.isPending ? 'Создание...' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Удалить пользователя?"
        message={`Пользователь «${deleteTarget?.login}» будет удалён безвозвратно.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </Layout>
  );
}
