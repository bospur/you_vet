import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import * as v from 'valibot';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory, updateCategory } from '../../../../data/source/categories';
import { useNotification } from '../../../../shared/ui/Notification/NotificationContext';
import type { CategoryRow, CategoryFormValues } from '../../domain/types';

const schema = v.object({
  animal_id: v.pipe(v.number(), v.minValue(1, 'Выберите животное')),
  name: v.pipe(v.string(), v.minLength(1, 'Введите название')),
  slug: v.pipe(
    v.string(),
    v.minLength(1, 'Введите slug'),
    v.regex(/^[a-z0-9-]+$/, 'Только строчные латинские буквы, цифры и дефис'),
  ),
  icon: v.string(),
  sort_order: v.pipe(v.number(), v.minValue(0, 'Минимум 0')),
});

interface UseCategoryFormDialogLogicProps {
  category: CategoryRow | null;
  onClose: () => void;
}

export function useCategoryFormDialogLogic({ category, onClose }: UseCategoryFormDialogLogicProps) {
  const { notify } = useNotification();
  const queryClient = useQueryClient();
  const isEdit = category !== null;

  const form = useForm<CategoryFormValues>({
    resolver: valibotResolver(schema),
    defaultValues: { animal_id: 0, name: '', slug: '', icon: '', sort_order: 0 },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        animal_id: category.animal_id,
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        sort_order: category.sort_order,
      });
    } else {
      form.reset({ animal_id: 0, name: '', slug: '', icon: '', sort_order: 0 });
    }
  }, [category, form]);

  const mutation = useMutation({
    mutationFn: (values: CategoryFormValues) =>
      isEdit ? updateCategory(category!.id, values) : createCategory(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      notify(isEdit ? 'Категория обновлена' : 'Категория добавлена', 'success');
      onClose();
    },
    onError: () => {
      notify('Ошибка сохранения', 'error');
    },
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  return { form, onSubmit, isEdit, loading: mutation.isPending };
}
