import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, TextField, Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Layout } from '../../shared/ui/Layout';
import { DoctorsTable } from '../../modules/doctors/features/DoctorsTable';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import {
  getDoctors, deleteDoctor, updateDoctorStatus, provisionDoctorPWA,
  type DoctorPWAAccount,
} from '../../data/source/doctors';
import { useNotification } from '../../shared/ui/Notification/NotificationContext';
import { useAuth } from '../../shared/config/AuthContext';
import type { Doctor } from '../../modules/doctors/domain/types';

const WEB_ORIGIN = 'https://web.bospur.ru';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export function DoctorsScreen() {
  const { notify } = useNotification();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));

  const [deleteTarget, setDeleteTarget] = useState<Doctor | null>(null);
  const [pwaDoctor, setPwaDoctor] = useState<Doctor | null>(null);
  const [pwaCreds, setPwaCreds] = useState<DoctorPWAAccount | null>(null);

  const { data: doctors = [], isLoading, isError } = useQuery({
    queryKey: ['doctors'],
    queryFn: getDoctors,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDoctor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      notify('Врач удалён', 'success');
      setDeleteTarget(null);
    },
    onError: () => notify('Ошибка удаления', 'error'),
  });

  const publishMutation = useMutation({
    mutationFn: (d: Doctor) =>
      updateDoctorStatus(d.id, d.status === 'published' ? 'draft' : 'published'),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      notify(
        updated.status === 'published' ? 'Врач опубликован' : 'Врач снят с публикации',
        'success',
      );
    },
    onError: () => notify('Ошибка изменения статуса', 'error'),
  });

  const pwaMutation = useMutation({
    mutationFn: ({ id, reset }: { id: number; reset: boolean }) => provisionDoctorPWA(id, reset),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      setPwaCreds(data);
      if (data.password) {
        notify(data.reset ? 'Пароль сброшен — скопируйте новый' : 'Аккаунт создан — скопируйте данные', 'success');
      }
    },
    onError: () => notify('Не удалось создать аккаунт PWA', 'error'),
  });

  const role = user?.role ?? 'editor';
  const staffLoginURL = `${WEB_ORIGIN}${pwaCreds?.login_url || '/auth/staff'}`;

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      notify(`${label} скопирован`, 'success');
    } catch {
      notify('Не удалось скопировать', 'error');
    }
  };

  const openPWA = (d: Doctor) => {
    setPwaDoctor(d);
    setPwaCreds(null);
    if (d.has_pwa_account) {
      pwaMutation.mutate({ id: d.id, reset: false });
    }
  };

  return (
    <Layout title="Врачи">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>Врачи</Typography>
        {isMobile ? (
          <Tooltip title="Добавить">
            <IconButton color="primary" onClick={() => navigate('/doctors/new')}><AddIcon /></IconButton>
          </Tooltip>
        ) : (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/doctors/new')}>
            Добавить
          </Button>
        )}
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}
      {isError && <Typography color="error">Не удалось загрузить список врачей</Typography>}

      {!isLoading && !isError && (
        <DoctorsTable
          data={doctors}
          role={role}
          baseUrl={BASE_URL}
          onEdit={(d) => navigate(`/doctors/${d.id}/edit`)}
          onDelete={setDeleteTarget}
          onPublish={(d) => publishMutation.mutate(d)}
          onPWAAccount={openPWA}
        />
      )}

      <Dialog
        open={!!pwaDoctor}
        onClose={() => { setPwaDoctor(null); setPwaCreds(null); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {pwaDoctor?.has_pwa_account && !pwaCreds?.password
            ? 'Аккаунт в приложении'
            : 'Аккаунт врача в PWA'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Вход отдельно от клиентов: {staffLoginURL}
          </Typography>
          {pwaMutation.isPending && !pwaCreds && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          )}
          {pwaCreds && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <TextField
                label="Адрес входа"
                value={staffLoginURL}
                size="small"
                fullWidth
                InputProps={{ readOnly: true }}
                onClick={() => void copyText(staffLoginURL, 'Адрес')}
              />
              <TextField
                label="Логин"
                value={pwaCreds.login}
                size="small"
                fullWidth
                InputProps={{ readOnly: true }}
                onClick={() => void copyText(pwaCreds.login, 'Логин')}
              />
              {pwaCreds.password ? (
                <TextField
                  label="Пароль (показывается один раз)"
                  value={pwaCreds.password}
                  size="small"
                  fullWidth
                  InputProps={{ readOnly: true }}
                  onClick={() => void copyText(pwaCreds.password!, 'Пароль')}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Пароль уже выдавался. Сбросьте, если врач его потерял.
                </Typography>
              )}
            </Box>
          )}
          {pwaDoctor && !pwaDoctor.has_pwa_account && !pwaCreds && !pwaMutation.isPending && (
            <Typography>
              Создать логин и пароль для «{pwaDoctor.full_name}»? Врач входит на {staffLoginURL} — не через код клиентам.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setPwaDoctor(null); setPwaCreds(null); }}>Закрыть</Button>
          {pwaDoctor && !pwaDoctor.has_pwa_account && !pwaCreds?.created && (
            <Button
              variant="contained"
              disabled={pwaMutation.isPending}
              onClick={() => pwaMutation.mutate({ id: pwaDoctor.id, reset: false })}
            >
              Создать аккаунт
            </Button>
          )}
          {pwaDoctor?.has_pwa_account && (
            <Button
              color="warning"
              disabled={pwaMutation.isPending}
              onClick={() => pwaMutation.mutate({ id: pwaDoctor.id, reset: true })}
            >
              Сбросить пароль
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Удалить врача?"
        message={`«${deleteTarget?.full_name}» будет удалён безвозвратно.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </Layout>
  );
}
