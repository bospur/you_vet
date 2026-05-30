import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import { Layout } from '../../shared/ui/Layout';
import { fetchStatsSummary, type StatsSummary } from '../../data/source/stats';
import { useNotification } from '../../shared/ui/Notification/NotificationContext';

const CARDS: { key: keyof StatsSummary; label: string }[] = [
  { key: 'today', label: 'Сегодня' },
  { key: 'last_7_days', label: 'За 7 дней' },
  { key: 'last_30_days', label: 'За 30 дней' },
  { key: 'total', label: 'Всего' },
];

export function DashboardScreen() {
  const { notify } = useNotification();
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchStatsSummary()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) notify('Не удалось загрузить статистику', 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [notify]);

  return (
    <Layout title="Обзор">
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <InsightsIcon color="primary" />
        <Typography variant="h5" fontWeight={600}>
          Пользователи Mini App
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Уникальные посетители Telegram по активности (last_seen).
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {CARDS.map(({ key, label }) => (
            <Grid key={key} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {label}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {stats?.[key] ?? 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Layout>
  );
}
