import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, CircularProgress, IconButton,
  Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Layout } from '../../shared/ui/Layout';
import { DoctorsTable } from '../../modules/doctors/features/DoctorsTable';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { getDoctors, deleteDoctor, updateDoctorStatus } from '../../data/source/doctors';
import { useNotification } from '../../shared/ui/Notification/NotificationContext';
import { useAuth } from '../../shared/config/AuthContext';
import type { Doctor } from '../../modules/doctors/domain/types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export function DoctorsScreen() {
  const { notify } = useNotification();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));

  const [deleteTarget, setDeleteTarget] = useState<Doctor | null>(null);

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

  const role = user?.role ?? 'editor';

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
        />
      )}

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
