import { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import InsightsIcon from '@mui/icons-material/Insights';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import TelegramIcon from '@mui/icons-material/Telegram';
import { Layout } from '../../shared/ui/Layout';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import {
  deleteMobileAppUser,
  fetchMobileAppUsers,
  fetchMobileStatsSummary,
  fetchStatsSummary,
  fetchTelegramAppUsers,
  inviteMobileStaff,
  patchMobileAppRole,
  type MobileAppRole,
  type MobileAppUser,
  type StatsSummary,
  type TelegramAppUser,
} from '../../data/source/stats';
import { useNotification } from '../../shared/ui/Notification/NotificationContext';

const API_URL = import.meta.env.VITE_API_URL ?? '';

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

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('7')) {
    return `+7 ${digits.slice(1, 4)} *** ${digits.slice(-2)}`;
  }
  if (phone.length > 4) return `${phone.slice(0, 4)} *** ${phone.slice(-2)}`;
  return phone || '—';
}

function displayTelegramName(u: TelegramAppUser): string {
  return u.first_name?.trim() || '—';
}

function displayTelegramUsername(u: TelegramAppUser): string {
  const name = u.username?.trim();
  return name ? `@${name}` : '—';
}

function displayMobileName(u: MobileAppUser): string {
  return u.display_name?.trim() || '—';
}

function StatsCards({ stats, loading }: { stats: StatsSummary | null; loading: boolean }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
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
  );
}

function MiniAppTab() {
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
      .then((data) => { if (!cancelled) setStats(data); })
      .catch(() => { if (!cancelled) notify('Не удалось загрузить статистику', 'error'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [notify]);

  useEffect(() => {
    let cancelled = false;
    fetchTelegramAppUsers()
      .then((data) => { if (!cancelled) setUsers(data); })
      .catch(() => { if (!cancelled) notify('Не удалось загрузить список пользователей', 'error'); })
      .finally(() => { if (!cancelled) setUsersLoading(false); });
    return () => { cancelled = true; };
  }, [notify]);

  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Уникальные посетители Telegram по активности (last_seen).
      </Typography>
      <StatsCards stats={stats} loading={loading} />

      <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>
        Список посетителей
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
              <Typography fontWeight={600}>{displayTelegramName(u)}</Typography>
              <Typography variant="body2" color="text.secondary">
                {displayTelegramUsername(u)} · ID {u.telegram_user_id}
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
                    <TableCell key={h} sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.telegram_user_id} hover>
                    <TableCell>{displayTelegramName(u)}</TableCell>
                    <TableCell>{displayTelegramUsername(u)}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>{u.telegram_user_id}</TableCell>
                    <TableCell>{formatDateTime(u.first_seen)}</TableCell>
                    <TableCell>{formatDateTime(u.last_seen)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </>
  );
}

const ROLE_LABEL: Record<MobileAppRole, string> = {
  client: 'Клиент',
  doctor: 'Врач',
  groomer: 'Грумер',
  chief_vet: 'Главврач',
};

function MobileAppTab() {
  const { notify } = useNotification();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [users, setUsers] = useState<MobileAppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<MobileAppUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<MobileAppRole>('doctor');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchMobileStatsSummary()
      .then((data) => { if (!cancelled) setStats(data); })
      .catch(() => { if (!cancelled) notify('Не удалось загрузить статистику приложения', 'error'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [notify]);

  useEffect(() => {
    let cancelled = false;
    fetchMobileAppUsers()
      .then((data) => { if (!cancelled) setUsers(data); })
      .catch(() => { if (!cancelled) notify('Не удалось загрузить пользователей приложения', 'error'); })
      .finally(() => { if (!cancelled) setUsersLoading(false); });
    return () => { cancelled = true; };
  }, [notify]);

  const authLabel = (u: MobileAppUser) => {
    const parts: string[] = [];
    if (u.vk_user_id) parts.push('VK');
    if (u.telegram_user_id) parts.push('Telegram');
    if (u.phone) parts.push('телефон');
    return parts.length ? parts.join(' · ') : '—';
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMobileAppUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setStats((prev) =>
        prev ? { ...prev, total: Math.max(0, prev.total - 1) } : prev,
      );
      notify('Пользователь приложения удалён', 'success');
      setDeleteTarget(null);
    } catch {
      notify('Не удалось удалить пользователя', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleRoleChange = async (id: number, app_role: MobileAppRole) => {
    try {
      const updated = await patchMobileAppRole(id, app_role);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, app_role: updated.app_role ?? app_role } : u)));
      notify('Роль обновлена', 'success');
    } catch {
      notify('Не удалось сменить роль', 'error');
    }
  };

  const handleInvite = async () => {
    if (!invitePhone.trim() && !inviteEmail.trim()) {
      notify('Укажите телефон или email', 'error');
      return;
    }
    setInviting(true);
    try {
      const created = await inviteMobileStaff({
        phone: invitePhone.trim() || undefined,
        email: inviteEmail.trim() || undefined,
        display_name: inviteName.trim() || undefined,
        app_role: inviteRole,
      });
      setUsers((prev) => [created, ...prev.filter((u) => u.id !== created.id)]);
      setInvitePhone('');
      setInviteEmail('');
      setInviteName('');
      notify('Сотрудник PWA сохранён', 'success');
    } catch {
      notify('Не удалось пригласить сотрудника', 'error');
    } finally {
      setInviting(false);
    }
  };

  const roleSelect = (u: MobileAppUser) => (
    <Select
      size="small"
      value={u.app_role ?? 'client'}
      onChange={(e) => void handleRoleChange(u.id, e.target.value as MobileAppRole)}
      sx={{ minWidth: 130 }}
    >
      {(Object.keys(ROLE_LABEL) as MobileAppRole[]).map((role) => (
        <MenuItem key={role} value={role}>{ROLE_LABEL[role]}</MenuItem>
      ))}
    </Select>
  );

  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Пользователи PWA «Ветпрактика». Роль меняет оболочку: клиент, врач, грумер, главврач.
      </Typography>
      <StatsCards stats={stats} loading={loading} />

      <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>
        Персонал PWA
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
          <TextField size="small" label="Телефон" value={invitePhone} onChange={(e) => setInvitePhone(e.target.value)} placeholder="+79…" />
          <TextField size="small" label="Email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
          <TextField size="small" label="Имя" value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Роль</InputLabel>
            <Select value={inviteRole} label="Роль" onChange={(e) => setInviteRole(e.target.value as MobileAppRole)}>
              <MenuItem value="doctor">Врач</MenuItem>
              <MenuItem value="groomer">Грумер</MenuItem>
              <MenuItem value="chief_vet">Главврач</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={() => void handleInvite()} disabled={inviting}>
            {inviting ? '…' : 'Пригласить'}
          </Button>
        </Stack>
      </Paper>

      <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>
        Список пользователей
      </Typography>

      {usersLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : users.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Пока нет записей. Появятся после первых входов в мобильное приложение.
          </Typography>
        </Paper>
      ) : isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {users.map((u) => (
            <Paper key={u.id} variant="outlined" sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Avatar
                src={u.photo_url ? `${API_URL}${u.photo_url}` : undefined}
                sx={{ width: 44, height: 44 }}
              >
                {displayMobileName(u).charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontWeight={600}>{displayMobileName(u)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {maskPhone(u.phone)} · {authLabel(u)}
                </Typography>
                <Box sx={{ mt: 1 }}>{roleSelect(u)}</Box>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  ID {u.id} · {formatDateTime(u.linked_at ?? u.created_at)}
                </Typography>
              </Box>
              <IconButton
                size="small"
                color="error"
                aria-label="Удалить пользователя"
                onClick={() => setDeleteTarget(u)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Paper>
          ))}
        </Box>
      ) : (
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['', 'Имя', 'Телефон', 'Роль', 'Вход', 'Telegram', 'VK', 'Дата', ''].map((h) => (
                    <TableCell key={h || 'avatar'} sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>
                      <Avatar
                        src={u.photo_url ? `${API_URL}${u.photo_url}` : undefined}
                        sx={{ width: 36, height: 36 }}
                      >
                        {displayMobileName(u).charAt(0)}
                      </Avatar>
                    </TableCell>
                    <TableCell>{displayMobileName(u)}</TableCell>
                    <TableCell>{maskPhone(u.phone)}</TableCell>
                    <TableCell>{roleSelect(u)}</TableCell>
                    <TableCell>{authLabel(u)}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>
                      {u.telegram_user_id ?? '—'}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>
                      {u.vk_user_id ?? '—'}
                    </TableCell>
                    <TableCell>{formatDateTime(u.linked_at ?? u.created_at)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label="Удалить пользователя"
                        onClick={() => setDeleteTarget(u)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Удалить пользователя приложения?"
        message={
          deleteTarget
            ? `${displayMobileName(deleteTarget)} будет удалён из базы. Активная сессия в приложении завершится при следующем запросе.`
            : ''
        }
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onClose={() => !deleting && setDeleteTarget(null)}
      />
    </>
  );
}

export function DashboardScreen() {
  const [tab, setTab] = useState(0);

  return (
    <Layout title="Обзор">
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <InsightsIcon color="primary" />
        <Typography variant="h5" fontWeight={600}>
          Пользователи
        </Typography>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<TelegramIcon />} iconPosition="start" label="Mini App" />
        <Tab icon={<PhoneAndroidIcon />} iconPosition="start" label="Приложение" />
      </Tabs>

      {tab === 0 ? <MiniAppTab /> : <MobileAppTab />}
    </Layout>
  );
}
