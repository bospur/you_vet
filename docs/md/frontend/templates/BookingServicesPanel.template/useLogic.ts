/**
 * Presentation logic — RHF, mutations, local UI state.
 * Copy to: modules/booking/feature/BookingServicesPanel/useLogic.ts
 *
 * Rules:
 * - No direct axios / source imports
 * - Only repository hooks from @/data/repositories/booking
 */
import { useState } from 'react';
import { useNotification } from '@/shared/ui/Notification/NotificationContext';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import {
  useBookingServiceTypesQuery,
  useCreateBookingServiceTypeMutation,
} from '@/data/repositories/booking';
import type { BookingServiceTypeDTO, CreateBookingServiceTypeInput } from '@/data/repositories/booking';

type DialogState = {
  open: boolean;
  item: BookingServiceTypeDTO | null;
};

export function useBookingServicesLogic() {
  const { notify } = useNotification();
  const { data = [], isLoading, isError, error } = useBookingServiceTypesQuery();
  const createMutation = useCreateBookingServiceTypeMutation();

  const [dialog, setDialog] = useState<DialogState>({ open: false, item: null });
  const [deleteTarget, setDeleteTarget] = useState<BookingServiceTypeDTO | null>(null);

  const openCreate = () => setDialog({ open: true, item: null });
  const openEdit = (item: BookingServiceTypeDTO) => setDialog({ open: true, item });
  const closeDialog = () => setDialog({ open: false, item: null });

  const handleSubmit = async (values: CreateBookingServiceTypeInput) => {
    try {
      await createMutation.mutateAsync(values);
      closeDialog();
      notify('Услуга создана', 'success');
    } catch (e) {
      notify(getApiErrorMessage(e, 'Ошибка сохранения'), 'error');
    }
  };

  return {
    items: data,
    isLoading,
    isError,
    errorMessage: getApiErrorMessage(error),
    isSubmitting: createMutation.isPending,
    dialog: {
      open: dialog.open,
      item: dialog.item,
      onClose: closeDialog,
      onSubmit: handleSubmit,
    },
    deleteDialog: {
      open: deleteTarget !== null,
      item: deleteTarget,
      onClose: () => setDeleteTarget(null),
    },
    openCreate,
    openEdit,
    confirmDelete: setDeleteTarget,
  };
}
