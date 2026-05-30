import { useEffect } from 'react';
import { useNavigate, useParams, useBlocker } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import * as v from 'valibot';
import {
  Box, Button, Chip, CircularProgress,
  FormControl, FormHelperText, InputLabel, MenuItem, Select,
  Stack, TextField, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import PublishIcon from '@mui/icons-material/Publish';
import UnpublishedIcon from '@mui/icons-material/Unpublished';
import { Layout } from '../../shared/ui/Layout';
import { RichTextEditor } from '../../shared/ui/RichTextEditor';
import { getAnimals } from '../../data/source/animals';
import {
  getArticle,
  createArticle, updateArticle, updateArticleStatus,
} from '../../data/source/articles';
import { useNotification } from '../../shared/ui/Notification/NotificationContext';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { useAuth } from '../../shared/config/AuthContext';
import type { ArticleFormValues } from '../../modules/articles/domain/types';

const schema = v.object({
  title: v.pipe(v.string(), v.minLength(1, 'Введите заголовок')),
  content: v.string(),
  animal_id: v.pipe(v.number(), v.minValue(1, 'Выберите животное')),
});

export function ArticleEditorScreen() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const articleId = id ? Number(id) : null;

  const navigate = useNavigate();
  const { notify } = useNotification();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const queryClient = useQueryClient();

  const form = useForm<ArticleFormValues>({
    resolver: valibotResolver(schema),
    defaultValues: { title: '', content: '', animal_id: 0 },
  });
  const { control, formState: { errors, isDirty }, reset, setValue, getValues } = form;

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (isDirty) e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const { data: article, isLoading: articleLoading } = useQuery({
    queryKey: ['article', articleId],
    queryFn: () => getArticle(articleId!),
    enabled: isEdit,
  });

  const { data: animals = [], isLoading: animalsLoading } = useQuery({
    queryKey: ['animals'],
    queryFn: getAnimals,
  });

  useEffect(() => {
    if (article) {
      reset({
        title: article.title,
        content: article.content,
        animal_id: article.animal_id,
      });
    }
  }, [article, reset]);

  useEffect(() => {
    if (!isEdit && animals.length > 0 && !getValues('animal_id')) {
      setValue('animal_id', animals[0].id);
    }
  }, [animals, isEdit, getValues, setValue]);

  useEffect(() => {
    if (article && !isAdmin && article.status === 'published') {
      notify('Опубликованные статьи недоступны для редактирования', 'error');
      navigate('/articles');
    }
  }, [article, isAdmin, navigate, notify]);

  const saveMutation = useMutation({
    mutationFn: async (values: ArticleFormValues) => {
      if (isEdit) {
        await updateArticle(articleId!, values);
      } else {
        await createArticle(values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      notify(isEdit ? 'Статья обновлена' : 'Статья создана', 'success');
      navigate('/articles');
    },
    onError: () => notify('Ошибка сохранения', 'error'),
  });

  const publishMutation = useMutation({
    mutationFn: () => updateArticleStatus(
      articleId!,
      article?.status === 'published' ? 'draft' : 'published',
    ),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      notify(
        updated.status === 'published' ? 'Статья опубликована' : 'Статья снята с публикации',
        'success',
      );
    },
    onError: () => notify('Ошибка изменения статуса', 'error'),
  });

  const onSubmit = form.handleSubmit((values) => saveMutation.mutate(values));
  const blocker = useBlocker(isDirty && !saveMutation.isPending);
  const isLoading = (isEdit && articleLoading) || animalsLoading;

  return (
    <Layout title={isEdit ? 'Редактировать статью' : 'Новая статья'}>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ maxWidth: 800 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/articles')}>
                Назад
              </Button>
              {isEdit && article && (
                article.status === 'published'
                  ? <Chip label="Опубликована" color="success" size="small" variant="outlined" />
                  : <Chip label="Черновик" size="small" variant="outlined" />
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {isAdmin && isEdit && (
                <Button
                  variant="outlined"
                  startIcon={publishMutation.isPending
                    ? <CircularProgress size={16} color="inherit" />
                    : article?.status === 'published' ? <UnpublishedIcon /> : <PublishIcon />}
                  onClick={() => publishMutation.mutate()}
                  disabled={publishMutation.isPending}
                >
                  {article?.status === 'published' ? 'Снять' : 'Опубликовать'}
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={saveMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                onClick={onSubmit}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </Box>
          </Box>

          <Stack spacing={3}>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Заголовок"
                  fullWidth
                  autoFocus
                  error={!!errors.title}
                  helperText={errors.title?.message}
                />
              )}
            />

            <Controller
              name="animal_id"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.animal_id}>
                  <InputLabel id="animal-label">Животное</InputLabel>
                  <Select
                    labelId="animal-label"
                    label="Животное"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  >
                    {animals.map((animal) => (
                      <MenuItem key={animal.id} value={animal.id}>
                        {animal.icon ? `${animal.icon} ` : ''}{animal.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.animal_id && (
                    <FormHelperText>{errors.animal_id.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />

            <Box>
              <Typography component="label" sx={{ mb: 0.75, fontSize: '0.875rem', display: 'block' }}>
                Содержание
              </Typography>
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.content}
                  />
                )}
              />
            </Box>
          </Stack>
        </Box>
      )}
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Несохранённые изменения"
        message="Вы уходите со страницы. Все несохранённые изменения будут потеряны."
        confirmLabel="Покинуть"
        onConfirm={() => blocker.proceed?.()}
        onClose={() => blocker.reset?.()}
      />
    </Layout>
  );
}
