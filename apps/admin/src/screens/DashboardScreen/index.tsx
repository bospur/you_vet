import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import { Layout } from '../../shared/ui/Layout';
import {
  fetchStatsSummary,
  fetchTelegramAppUsers,
  type StatsSummary,
  type TelegramAppUser,
} from '../../data/source/stats';
import { useNotification } from '../../shared/ui/Notification/NotificationContext';

const CARDS: { key: keyof StatsSummary; label: string }[] = [
  { key: 'today', label: 'Сегодня' },
  { key: 'last_7_days', label: 'За 7 дней' },
  { key: 'last_30_days', label: 'За 30 дней' },
  { key: 'total', label: 'Всего' },
];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function displayName(u: TelegramAppUser): string {
  return u.first_name?.trim() || '—';
}

function displayUsername(u: TelegramAppUser): string {
  const name = u.username?.trim();
  return name ? `@${name}` : '—';
}

export function DashboardScreen() {
  const { notify } = useNotification();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [users, setUsers] = useState<TelegramAppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);

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

  useEffect(() => {
    let cancelled = false;
    fetchTelegramAppUsers()
      .then((data) => {
        if (!cancelled) setUsers(data);
      })
      .catch(() => {
        if (!cancelled) notify('Не удалось загрузить список пользователей', 'error');
      })
      .finally(() => {
        if (!cancelled) setUsersLoading(false);
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
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2} sx={{ mb: 4 }}>
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

      <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>
        Список посетителей
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Данные из Mini App (Telegram). Сортировка по последнему визиту.
      </Typography>

      {usersLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : users.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Пока нет записей. Появятся после первых визитов в Mini App.
          </Typography>
        </Paper>
      ) : isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {users.map((u) => (
            <Paper key={u.telegram_user_id} variant="outlined" sx={{ p: 2 }}>
              <Typography fontWeight={600}>{displayName(u)}</Typography>
              <Typography variant="body2" color="text.secondary">
                {displayUsername(u)} · ID {u.telegram_user_id}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Первый визит: {formatDateTime(u.first_seen)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Последний: {formatDateTime(u.last_seen)}
              </Typography>
            </Paper>
          ))}
        </Box>
      ) : (
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Имя', 'Username', 'Telegram ID', 'Первый визит', 'Последний визит'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.telegram_user_id} hover>
                    <TableCell>{displayName(u)}</TableCell>
                    <TableCell>{displayUsername(u)}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>
                      {u.telegram_user_id}
                    </TableCell>
                    <TableCell>{formatDateTime(u.first_seen)}</TableCell>
                    <TableCell>{formatDateTime(u.last_seen)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Layout>
  );
}
