/**
 * Feature component — markup only, logic in useLogic.
 * Copy to: modules/booking/feature/BookingServicesPanel/BookingServicesPanel.tsx
 */
import { Loader } from '@/shared/ui/Loader';
import { useBookingServicesLogic } from './useLogic';

export function BookingServicesPanel() {
  const logic = useBookingServicesLogic();

  if (logic.isLoading) return <Loader />;
  if (logic.isError) {
    return <p role="alert">{logic.errorMessage}</p>;
  }

  return (
    <section>
      <header>
        <h2>Услуги</h2>
        <button type="button" onClick={logic.openCreate}>
          Добавить
        </button>
      </header>

      <ul>
        {logic.items.map((item) => (
          <li key={item.id}>
            {item.name}
            <button type="button" onClick={() => logic.openEdit(item)}>
              Изменить
            </button>
            <button type="button" onClick={() => logic.confirmDelete(item)}>
              Удалить
            </button>
          </li>
        ))}
      </ul>

      {/* ServiceTypeFormDialog open={logic.dialog.open} ... */}
      {/* ConfirmDialog {...logic.deleteDialog} */}
    </section>
  );
}
