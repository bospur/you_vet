import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/shell/AppShell';
import { GroomingGuard } from './components/GroomingGuard';
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
import AnimalsScreen from './screens/content/AnimalsScreen';
import ArticlesScreen from './screens/content/ArticlesScreen';
import ArticleScreen from './screens/content/ArticleScreen';
import DoctorsScreen from './screens/content/DoctorsScreen';
import DoctorScreen from './screens/content/DoctorScreen';
import ScheduleScreen from './screens/content/ScheduleScreen';
import GroomingScreen from './screens/content/GroomingScreen';
import GroomingBreedsScreen from './screens/content/GroomingBreedsScreen';
import GroomingScheduleScreen from './screens/content/GroomingScheduleScreen';
import QuestionScreen from './screens/content/QuestionScreen';
import ProfileScreen from './screens/profile/ProfileScreen';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<ClinicLayout />}>
        <Route path="/splash" element={<SplashScreen />} />
        <Route path="/" element={<AppShell />}>
          <Route index element={<HomeScreen />} />
          <Route path="animals" element={<AnimalsScreen />} />
          <Route path="animals/:animalSlug/articles" element={<ArticlesScreen />} />
          <Route path="articles/:articleSlug" element={<ArticleScreen />} />
          <Route path="doctors" element={<DoctorsScreen />} />
          <Route path="doctors/:doctorId" element={<DoctorScreen />} />
          <Route path="schedule" element={<ScheduleScreen />} />
          <Route
            path="grooming"
            element={
              <GroomingGuard>
                <GroomingScreen />
              </GroomingGuard>
            }
          />
          <Route path="grooming/breeds" element={<GroomingBreedsScreen />} />
          <Route path="grooming/schedule" element={<GroomingScheduleScreen />} />
          <Route path="question" element={<QuestionScreen />} />
          <Route path="more" element={<MoreScreen />} />
          <Route path="profile" element={<ProfileScreen />} />
          <Route path="booking" element={<BookingHubScreen />} />
          <Route path="booking/new" element={<PlaceholderScreen title="Выбор услуги" />} />
          <Route path="booking/requests" element={<PlaceholderScreen title="Мои заявки" />} />
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
