/**
 * Thin screen — composition only.
 * Copy to: screens/BookingScreen/BookingScreen.tsx
 */
import { Layout } from '@/shared/ui/Layout';
import { BookingTabs } from '@/modules/booking';

export function BookingScreen() {
  return (
    <Layout title="Запись">
      <BookingTabs />
    </Layout>
  );
}
