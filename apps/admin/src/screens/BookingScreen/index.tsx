import { useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Box, Tab, Tabs, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Layout } from '../../shared/ui/Layout';
import { useAuth } from '../../shared/config/AuthContext';
import { BookingServicesPanel } from '../../modules/booking/features/BookingServicesPanel';
import { BookingSchedulePanel } from '../../modules/booking/features/BookingSchedulePanel';
import { BookingRequestsPanel } from '../../modules/booking/features/BookingRequestsPanel';
import { BookingSettingsPanel } from '../../modules/booking/features/BookingSettingsPanel';

export type BookingTab = 'services' | 'schedule' | 'requests' | 'settings';

const TABS: { value: BookingTab; label: string; adminOnly?: boolean }[] = [
  { value: 'services', label: 'Услуги' },
  { value: 'schedule', label: 'Расписание' },
  { value: 'requests', label: 'Заявки' },
  { value: 'settings', label: 'Настройки', adminOnly: true },
];

const LEGACY_TAB: Record<string, BookingTab> = {
  services: 'services',
  schedule: 'schedule',
  requests: 'requests',
  settings: 'settings',
};

export function BookingScreen() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const isAdmin = user?.role === 'admin';

  const rawTab = searchParams.get('tab') ?? 'services';
  const tab: BookingTab = LEGACY_TAB[rawTab] ?? 'services';

  useEffect(() => {
    if (tab === 'settings' && !isAdmin) {
      setSearchParams({ tab: 'services' }, { replace: true });
    }
  }, [tab, isAdmin, setSearchParams]);

  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);

  const handleTabChange = (_: unknown, value: BookingTab) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <Layout title="Запись">
      <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={600} sx={{ mb: 2 }}>
        Запись на приём
      </Typography>

      <Tabs
        value={tab}
        onChange={handleTabChange}
        variant={isMobile ? 'scrollable' : 'standard'}
        scrollButtons={isMobile ? 'auto' : false}
        allowScrollButtonsMobile
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {visibleTabs.map((t) => (
          <Tab key={t.value} value={t.value} label={t.label} />
        ))}
      </Tabs>

      <Box>
        {tab === 'services' && <BookingServicesPanel />}
        {tab === 'schedule' && <BookingSchedulePanel />}
        {tab === 'requests' && <BookingRequestsPanel />}
        {tab === 'settings' && isAdmin && <BookingSettingsPanel />}
      </Box>
    </Layout>
  );
}

/** Редирект со старых URL /booking/services → /booking?tab=services */
export function BookingLegacyRedirect({ section }: { section: BookingTab }) {
  return <Navigate to={`/booking?tab=${section}`} replace />;
}
