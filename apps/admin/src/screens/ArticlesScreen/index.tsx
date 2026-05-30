import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, CircularProgress, IconButton,
  Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Layout } from '../../shared/ui/Layout';
import { ArticlesTable, MAX_FEATURED_ARTICLES } from '../../modules/articles/features/ArticlesTable';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { getArticles, deleteArticle, updateArticleStatus } from '../../data/source/articles';
import { useNotification } from '../../shared/ui/Notification/NotificationContext';
import { useAuth } from '../../shared/config/AuthContext';
import type { Article } from '../../modules/articles/domain/types';

export function ArticlesScreen() {
  const { notify } = useNotification();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));

  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);

  const { data: articles = [], isLoading, isError } = useQuery({
    queryKey: ['articles'],
    queryFn: getArticles,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      notify('Статья удалена', 'success');
      setDeleteTarget(null);
    },
    onError: () => notify('Ошибка удаления', 'error'),
  });

  const publishMutation = useMutation({
    mutationFn: (article: Article) =>
      updateArticleStatus(article.id, article.status === 'published' ? 'draft' : 'published'),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      notify(
        updated.status === 'published' ? 'Статья опубликована' : 'Статья снята с публикации',
        'success',
      );
    },
    onError: () => notify('Ошибка изменения статуса', 'error'),
  });

  const role = user?.role ?? 'editor';
  const featuredCount = articles.filter((a) => a.featured).length;

  return (
    <Layout title="Статьи">
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: 1,
        mb: 3,
      }}>
        <Box>
          <Typography variant="h5" fontWeight={600}>Статьи</Typography>
          {role === 'admin' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              На главной: {featuredCount} / {MAX_FEATURED_ARTICLES}
            </Typography>
          )}
        </Box>
        {isMobile ? (
          <Tooltip title="Добавить">
            <IconButton color="primary" onClick={() => navigate('/articles/new')}><AddIcon /></IconButton>
          </Tooltip>
        ) : (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/articles/new')}>
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
        <Typography color="error">Не удалось загрузить статьи</Typography>
      )}

      {!isLoading && !isError && (
        <ArticlesTable
          data={articles}
          role={role}
          onEdit={(a) => navigate(`/articles/${a.id}/edit`)}
          onDelete={setDeleteTarget}
          onPublish={(a) => publishMutation.mutate(a)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Удалить статью?"
        message={`«${deleteTarget?.title}» будет удалена безвозвратно.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </Layout>
  );
}
