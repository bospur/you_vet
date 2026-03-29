import { useEffect, useState } from 'react';
import { useNavigate, useParams, useBlocker } from 'react-router-dom';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import * as v from 'valibot';
import {
  Accordion, AccordionDetails, AccordionSummary,
  Box, Button, Checkbox, Chip, CircularProgress,
  FormControlLabel, FormHelperText, InputLabel,
  Stack, TextField, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import PublishIcon from '@mui/icons-material/Publish';
import UnpublishedIcon from '@mui/icons-material/Unpublished';
import { Layout } from '../../shared/ui/Layout';
import { RichTextEditor } from '../../shared/ui/RichTextEditor';
import { getAnimals } from '../../data/source/animals';
import { getCategoriesByAnimalSlug } from '../../data/source/categories';
import {
  getArticle, getArticleCategories,
  createArticle, updateArticle, updateArticleStatus,
  assignCategory, unassignCategory,
} from '../../data/source/articles';
import { useNotification } from '../../shared/ui/Notification/NotificationContext';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { useAuth } from '../../shared/config/AuthContext';
import type { ArticleFormValues } from '../../modules/articles/domain/types';

const schema = v.object({
  title: v.pipe(v.string(), v.minLength(1, 'Введите заголовок')),
  slug: v.pipe(
    v.string(),
    v.minLength(1, 'Введите slug'),
    v.regex(/^[a-z0-9-]+$/, 'Только строчные латинские буквы, цифры и дефис'),
  ),
  content: v.string(),
  categoryIds: v.array(v.number()),
});

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[а-яёa-z0-9]+/gi, (w) => {
      const ru: Record<string, string> = {
        а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'j',
        к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
        х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
      };
      return w.split('').map((c) => ru[c] ?? c).join('');
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function ArticleEditorScreen() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const articleId = id ? Number(id) : null;

  const navigate = useNavigate();
  const { notify } = useNotification();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const queryClient = useQueryClient();

  const [expandedAnimal, setExpandedAnimal] = useState<number | null>(null);

  const form = useForm<ArticleFormValues>({
    resolver: valibotResolver(schema),
    defaultValues: { title: '', slug: '', content: '', categoryIds: [] },
  });
  const { control, formState: { errors, isDirty }, setValue, watch, reset } = form;
  const titleValue = watch('title');
  const categoryIds = watch('categoryIds');

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (isDirty) e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Загрузка статьи при редактировании
  const { data: article, isLoading: articleLoading } = useQuery({
    queryKey: ['article', articleId],
    queryFn: () => getArticle(articleId!),
    enabled: isEdit,
  });

  const { data: articleCategories = [], isLoading: articleCatsLoading } = useQuery({
    queryKey: ['article-categories', articleId],
    queryFn: () => getArticleCategories(articleId!),
    enabled: isEdit,
  });

  // Заполняем форму после загрузки
  useEffect(() => {
    if (article && articleCategories) {
      reset({
        title: article.title,
        slug: article.slug,
        content: article.content,
        categoryIds: articleCategories.map((c) => c.id),
      });
    }
  }, [article, articleCategories, reset]);

  // Editor не может редактировать опубликованную статью
  useEffect(() => {
    if (article && !isAdmin && article.status === 'published') {
      notify('Опубликованные статьи недоступны для редактирования', 'error');
      navigate('/articles');
    }
  }, [article, isAdmin, navigate, notify]);

  // Загрузка животных и категорий для чекбоксов
  const { data: animals = [], isLoading: animalsLoading } = useQuery({
    queryKey: ['animals'],
    queryFn: getAnimals,
  });

  useEffect(() => {
    if (animals.length > 0 && expandedAnimal === null) {
      setExpandedAnimal(animals[0].id);
    }
  }, [animals, expandedAnimal]);

  const categoryQueries = useQueries({
    queries: animals.map((animal) => ({
      queryKey: ['categories', animal.slug],
      queryFn: () => getCategoriesByAnimalSlug(animal.slug),
      enabled: animals.length > 0,
    })),
  });

  const allCategories = categoryQueries.flatMap((q, i) =>
    (q.data ?? []).map((cat) => ({ ...cat, animalId: animals[i]?.id })),
  );

  // Авто-slug из заголовка (только при создании и пока slug не трогали вручную)
  const slugTouched = form.getFieldState('slug').isDirty;
  useEffect(() => {
    if (!isEdit && !slugTouched && titleValue) {
      setValue('slug', slugify(titleValue), { shouldValidate: false });
    }
  }, [titleValue, isEdit, slugTouched, setValue]);

  const saveMutation = useMutation({
    mutationFn: async (values: ArticleFormValues) => {
      let savedId = articleId;

      if (isEdit) {
        await updateArticle(articleId!, values);
      } else {
        const created = await createArticle(values);
        savedId = created.id;
      }

      // Diff категорий
      const prevIds = isEdit ? articleCategories.map((c) => c.id) : [];
      const toAssign = values.categoryIds.filter((cid) => !prevIds.includes(cid));
      const toUnassign = prevIds.filter((cid) => !values.categoryIds.includes(cid));

      await Promise.all([
        ...toAssign.map((cid) => assignCategory(savedId!, cid)),
        ...toUnassign.map((cid) => unassignCategory(savedId!, cid)),
      ]);
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

  const isLoading = (isEdit && (articleLoading || articleCatsLoading)) || animalsLoading;

  const toggleCategory = (catId: number) => {
    const current = form.getValues('categoryIds');
    setValue(
      'categoryIds',
      current.includes(catId) ? current.filter((id) => id !== catId) : [...current, catId],
    );
  };

  return (
    <Layout title={isEdit ? 'Редактировать статью' : 'Новая статья'}>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ maxWidth: 800 }}>
          {/* Шапка */}
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
            {/* Заголовок */}
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

            {/* Slug */}
            <Controller
              name="slug"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Slug"
                  fullWidth
                  error={!!errors.slug}
                  helperText={errors.slug?.message ?? 'Строчные латинские буквы, цифры, дефис'}
                />
              )}
            />

            {/* Контент */}
            <Box>
              <InputLabel sx={{ mb: 0.75, fontSize: '0.875rem' }}>Содержание</InputLabel>
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

            {/* Категории */}
            <Box>
              <InputLabel sx={{ mb: 1, fontSize: '0.875rem' }}>Категории</InputLabel>
              {animals.map((animal, i) => {
                const cats = categoryQueries[i]?.data ?? [];
                return (
                  <Accordion
                    key={animal.id}
                    expanded={expandedAnimal === animal.id}
                    onChange={() => setExpandedAnimal((p) => p === animal.id ? null : animal.id)}
                    disableGutters
                    sx={{ '&:before': { display: 'none' }, border: '1px solid', borderColor: 'divider', mb: 0.5 }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>
                        {animal.icon && <span style={{ marginRight: 8 }}>{animal.icon}</span>}
                        {animal.name}
                        {categoryIds.filter((cid) => allCategories.some((c) => c.id === cid && c.animalId === animal.id)).length > 0 && (
                          <Typography component="span" color="primary.main" sx={{ ml: 1, fontSize: '0.8rem' }}>
                            ({categoryIds.filter((cid) => allCategories.some((c) => c.id === cid && c.animalId === animal.id)).length})
                          </Typography>
                        )}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      {cats.length === 0 ? (
                        <Typography color="text.secondary" variant="body2">Нет категорий</Typography>
                      ) : (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {cats.map((cat) => (
                            <FormControlLabel
                              key={cat.id}
                              control={
                                <Checkbox
                                  size="small"
                                  checked={categoryIds.includes(cat.id)}
                                  onChange={() => toggleCategory(cat.id)}
                                />
                              }
                              label={cat.name}
                            />
                          ))}
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                );
              })}
              {errors.categoryIds && (
                <FormHelperText error>{String(errors.categoryIds.message)}</FormHelperText>
              )}
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
