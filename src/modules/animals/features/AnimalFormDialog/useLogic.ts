import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import * as v from 'valibot';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAnimal, updateAnimal } from '../../../../data/source/animals';
import { useNotification } from '../../../../shared/ui/Notification/NotificationContext';
import type { Animal, AnimalFormValues } from '../../domain/types';

const schema = v.object({
  name: v.pipe(v.string(), v.minLength(1, 'Введите название')),
  slug: v.pipe(
    v.string(),
    v.minLength(1, 'Введите slug'),
    v.regex(/^[a-z0-9-]+$/, 'Только строчные латинские буквы, цифры и дефис'),
  ),
  icon: v.string(),
  sort_order: v.pipe(v.number(), v.minValue(0, 'Минимум 0')),
});

interface UseAnimalFormDialogLogicProps {
  animal: Animal | null;
  onClose: () => void;
}

export function useAnimalFormDialogLogic({ animal, onClose }: UseAnimalFormDialogLogicProps) {
  const { notify } = useNotification();
  const queryClient = useQueryClient();
  const isEdit = animal !== null;

  const form = useForm<AnimalFormValues>({
    resolver: valibotResolver(schema),
    defaultValues: { name: '', slug: '', icon: '', sort_order: 0 },
  });

  useEffect(() => {
    if (animal) {
      form.reset(animal);
    } else {
      form.reset({ name: '', slug: '', icon: '', sort_order: 0 });
    }
  }, [animal, form]);

  const mutation = useMutation({
    mutationFn: (values: AnimalFormValues) =>
      isEdit ? updateAnimal(animal!.id, values) : createAnimal(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      notify(isEdit ? 'Животное обновлено' : 'Животное добавлено', 'success');
      onClose();
    },
    onError: () => {
      notify('Ошибка сохранения', 'error');
    },
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  return { form, onSubmit, isEdit, loading: mutation.isPending };
}
