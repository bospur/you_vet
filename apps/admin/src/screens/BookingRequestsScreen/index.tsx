import { Stack, Typography } from '@mui/material';
import { Layout } from '../../shared/ui/Layout';
import { BookingRequestsPanel } from '../../modules/booking/features/BookingRequestsPanel';

export function BookingRequestsScreen() {
  return (
    <Layout title="Запись · заявки">
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={700}>
          Заявки на запись
        </Typography>
        <BookingRequestsPanel />
      </Stack>
    </Layout>
  );
}
