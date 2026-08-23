import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Chip,
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
import { Layout } from '../../shared/ui/Layout';
import {
  fetchDocsPortalStats,
  fetchDocsPortalVisitors,
} from '../../data/source/docsPortal';

const STAT_CARDS: { key: keyof Awaited<ReturnType<typeof fetchDocsPortalStats>>; label: string }[] = [
  { key: 'visitors_total', label: 'Всего' },
  { key: 'visitors_with_password', label: 'С паролем' },
  { key: 'active_today', label: 'Сегодня на портале' },
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

export function DocsPortalScreen() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const statsQuery = useQuery({
    queryKey: ['docs-portal-stats'],
    queryFn: fetchDocsPortalStats,
  });
  const visitorsQuery = useQuery({
    queryKey: ['docs-portal-visitors'],
    queryFn: fetchDocsPortalVisitors,
  });

  const visitors = visitorsQuery.data ?? [];

  return (
    <Layout title="Портал docs">
      <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
        Портал документации
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Кто регистрировался и когда последний раз входил. Канбан и комментарии — только с паролем.
      </Typography>

      {statsQuery.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {STAT_CARDS.map(({ key, label }) => (
            <Grid key={key} size={{ xs: 12, sm: 6, md: 4 }}>
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
            <Paper key={u.id} sx={{ p: 2 }}>
              <Typography fontWeight={600}>{u.display_name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDateTime(u.last_seen_at)}
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                {!u.has_password ? <Chip size="small" label="без пароля" color="warning" /> : (
                  <Chip size="small" label="пароль" color="success" variant="outlined" />
                )}
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
                  {['Имя', 'Последний вход', 'Аккаунт'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {visitors.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>{u.display_name}</TableCell>
                    <TableCell>{formatDateTime(u.last_seen_at)}</TableCell>
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
                    <TableCell colSpan={3}>
                      <Typography color="text.secondary">Пока никто не заходил</Typography>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Layout>
  );
}
