import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/shell/AppShell';
import { ClinicLayout } from './layouts/ClinicLayout';
import SplashScreen from './screens/SplashScreen';
import HomeScreen from './screens/HomeScreen';
import BookingHubScreen from './screens/booking/BookingHubScreen';
import LoginScreen from './screens/auth/LoginScreen';
import VerifyScreen from './screens/auth/VerifyScreen';
import LinkTelegramScreen from './screens/auth/LinkTelegramScreen';
import VkCallbackScreen from './screens/auth/VkCallbackScreen';
import { PlaceholderScreen } from './screens/PlaceholderScreen';
import MoreScreen from './screens/MoreScreen';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<ClinicLayout />}>
        <Route path="/splash" element={<SplashScreen />} />
        <Route path="/" element={<AppShell />}>
          <Route index element={<HomeScreen />} />
          <Route path="animals" element={<PlaceholderScreen title="Статьи" />} />
          <Route path="more" element={<MoreScreen />} />
          <Route path="booking" element={<BookingHubScreen />} />
          <Route path="booking/new" element={<PlaceholderScreen title="Выбор услуги" />} />
          <Route path="booking/requests" element={<PlaceholderScreen title="Мои заявки" />} />
          <Route path="doctors" element={<PlaceholderScreen title="Наши врачи" />} />
          <Route path="schedule" element={<PlaceholderScreen title="Расписание" />} />
          <Route path="auth/login" element={<LoginScreen />} />
          <Route path="auth/vk-callback" element={<VkCallbackScreen />} />
          <Route path="auth/verify" element={<VerifyScreen />} />
          <Route path="auth/link-telegram" element={<LinkTelegramScreen />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/splash" replace />} />
    </Routes>
  );
}
