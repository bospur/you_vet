import { useState } from 'react';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, CircularProgress, IconButton, Tooltip,
  Typography, useMediaQuery, useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Layout } from '../../shared/ui/Layout';
import { CategoriesTable } from '../../modules/categories/features/CategoriesTable';
import { CategoryFormDialog } from '../../modules/categories/features/CategoryFormDialog';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { getAnimals } from '../../data/source/animals';
import { getCategoriesByAnimalSlug, deleteCategory } from '../../data/source/categories';
import { useNotification } from '../../shared/ui/Notification/NotificationContext';
import type { CategoryRow } from '../../modules/categories/domain/types';

export function CategoriesScreen() {
  const { notify } = useNotification();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));

  const [formOpen, setFormOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<CategoryRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);

  // 1. Загружаем всех животных
  const { data: animals = [], isLoading: animalsLoading } = useQuery({
    queryKey: ['animals'],
    queryFn: getAnimals,
  });

  // 2. Параллельно загружаем категории для каждого животного
  const categoryQueries = useQueries({
    queries: animals.map((animal) => ({
      queryKey: ['categories', animal.slug],
      queryFn: () => getCategoriesByAnimalSlug(animal.slug),
      enabled: animals.length > 0,
    })),
  });

  const isLoading = animalsLoading || categoryQueries.some((q) => q.isLoading);
  const isError = categoryQueries.some((q) => q.isError);

  // 3. Собираем все категории в плоский список с именем животного
  const categories: CategoryRow[] = categoryQueries.flatMap((q, i) =>
    (q.data ?? []).map((cat) => ({
      ...cat,
      animalName: animals[i]?.name ?? '',
      animalSlug: animals[i]?.slug ?? '',
    })),
  );

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      notify('Категория удалена', 'success');
      setDeleteTarget(null);
    },
    onError: () => notify('Ошибка удаления', 'error'),
  });

  const handleEdit = (cat: CategoryRow) => {
    setEditCategory(cat);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditCategory(null);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditCategory(null);
  };

  return (
    <Layout title="Категории">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>Категории</Typography>
        {isMobile ? (
          <Tooltip title="Добавить">
            <IconButton color="primary" onClick={handleAdd}><AddIcon /></IconButton>
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
        <CategoriesTable
          animals={animals}
          data={categories}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
        />
      )}

      <CategoryFormDialog
        open={formOpen}
        category={editCategory}
        animals={animals}
        onClose={handleFormClose}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Удалить категорию?"
        message={`«${deleteTarget?.name}» будет удалена безвозвратно.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </Layout>
  );
}
