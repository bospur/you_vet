import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
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
import { Layout } from '../../shared/ui/Layout';
import {
  fetchDocsPortalStats,
  fetchDocsPortalVisitors,
  fetchDocsPortalVisits,
  type DocsPortalVisitor,
} from '../../data/source/docsPortal';

const STAT_CARDS: { key: keyof Awaited<ReturnType<typeof fetchDocsPortalStats>>; label: string }[] = [
  { key: 'visitors_with_password', label: 'С паролем' },
  { key: 'active_today', label: 'Сегодня на портале' },
  { key: 'visits_today', label: 'Заходы сегодня' },
  { key: 'visits_last_7_days', label: 'За 7 дней' },
];

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function pathLabel(path: string): string {
  if (!path) return '—';
  if (path === '/') return 'Главная';
  if (path.startsWith('/board')) return path.includes('task=') ? `Канбан ${path}` : 'Канбан';
  if (path === '/login') return 'Вход';
  return path.replace(/^\//, '');
}

export function DocsPortalScreen() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selected, setSelected] = useState<DocsPortalVisitor | null>(null);

  const statsQuery = useQuery({
    queryKey: ['docs-portal-stats'],
    queryFn: fetchDocsPortalStats,
  });
  const visitorsQuery = useQuery({
    queryKey: ['docs-portal-visitors'],
    queryFn: fetchDocsPortalVisitors,
  });
  const visitsQuery = useQuery({
    queryKey: ['docs-portal-visits', selected?.id],
    queryFn: () => fetchDocsPortalVisits(selected!.id),
    enabled: selected != null,
  });

  const visitors = visitorsQuery.data ?? [];

  return (
    <Layout title="Портал docs">
      <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
        Портал документации
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Кто входил на docs.bospur.ru: канбан и комментарии только с паролем. Документы публичные —
        в журнале есть заходы авторизованных пользователей по страницам.
      </Typography>

      {statsQuery.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {STAT_CARDS.map(({ key, label }) => (
            <Grid key={key} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {label}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {statsQuery.data?.[key] ?? 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {visitorsQuery.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {visitors.map((u) => (
            <Paper
              key={u.id}
              sx={{ p: 2, cursor: 'pointer' }}
              onClick={() => setSelected(u)}
            >
              <Typography fontWeight={600}>{u.display_name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDateTime(u.last_seen_at)} · {pathLabel(u.last_path)}
              </Typography>
              <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5 }}>
                <Chip size="small" label={`${u.visit_count} заходов`} variant="outlined" />
                {!u.has_password ? <Chip size="small" label="без пароля" color="warning" /> : null}
              </Box>
            </Paper>
          ))}
        </Box>
      ) : (
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Имя', 'Последний заход', 'Страница', 'Заходы', 'Аккаунт'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {visitors.map((u) => (
                  <TableRow
                    key={u.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setSelected(u)}
                  >
                    <TableCell>{u.display_name}</TableCell>
                    <TableCell>{formatDateTime(u.last_seen_at)}</TableCell>
                    <TableCell>{pathLabel(u.last_path)}</TableCell>
                    <TableCell>{u.visit_count}</TableCell>
                    <TableCell>
                      {u.has_password ? (
                        <Chip size="small" label="пароль" color="success" variant="outlined" />
                      ) : (
                        <Chip size="small" label="старый вход" color="warning" variant="outlined" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {visitors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography color="text.secondary">Пока никто не заходил</Typography>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{selected ? `Заходы · ${selected.display_name}` : 'Заходы'}</DialogTitle>
        <DialogContent>
          {visitsQuery.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (visitsQuery.data ?? []).length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              Журнал пуст — пользователь ещё не открывал страницы после входа.
            </Typography>
          ) : (
            <Table size="small">
              <TableBody>
                {(visitsQuery.data ?? []).map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>{pathLabel(v.path)}</TableCell>
                    <TableCell align="right">{formatDateTime(v.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
