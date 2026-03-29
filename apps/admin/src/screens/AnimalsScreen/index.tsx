import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Button, CircularProgress, IconButton, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Layout } from '../../shared/ui/Layout';
import { AnimalsTable } from '../../modules/animals/features/AnimalsTable';
import { AnimalFormDialog } from '../../modules/animals/features/AnimalFormDialog';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { getAnimals, deleteAnimal } from '../../data/source/animals';
import { useNotification } from '../../shared/ui/Notification/NotificationContext';
import type { Animal } from '../../modules/animals/domain/types';

export function AnimalsScreen() {
  const { notify } = useNotification();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [formOpen, setFormOpen] = useState(false);
  const [editAnimal, setEditAnimal] = useState<Animal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Animal | null>(null);

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['animals'],
    queryFn: getAnimals,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAnimal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      notify('Животное удалено', 'success');
      setDeleteTarget(null);
    },
    onError: () => {
      notify('Ошибка удаления', 'error');
    },
  });

  const handleEdit = (animal: Animal) => {
    setEditAnimal(animal);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditAnimal(null);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditAnimal(null);
  };

  return (
    <Layout title="Животные">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>Животные</Typography>
        {isMobile ? (
          <Tooltip title="Добавить">
            <IconButton color="primary" onClick={handleAdd}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
            Добавить
          </Button>
        )}
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Typography color="error">Не удалось загрузить данные</Typography>
      )}

      {!isLoading && !isError && (
        <AnimalsTable
          data={data}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
        />
      )}

      <AnimalFormDialog
        open={formOpen}
        animal={editAnimal}
        onClose={handleFormClose}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Удалить животное?"
        message={`«${deleteTarget?.name}» будет удалено безвозвратно.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </Layout>
  );
}
