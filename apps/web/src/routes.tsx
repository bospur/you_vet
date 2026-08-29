import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/shell/AppShell';
import { GroomingGuard } from './components/GroomingGuard';
import { Preloader } from './components/Preloader';
import { ClinicLayout } from './layouts/ClinicLayout';
import HomeScreen from './screens/HomeScreen';
import BookingHubScreen from './screens/booking/BookingHubScreen';
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

const LoginScreen = lazy(() => import('./screens/auth/LoginScreen'));
const VerifyScreen = lazy(() => import('./screens/auth/VerifyScreen'));
const LinkTelegramScreen = lazy(() => import('./screens/auth/LinkTelegramScreen'));
const VkCallbackScreen = lazy(() => import('./screens/auth/VkCallbackScreen'));

export function AppRoutes() {
  return (
    <Suspense fallback={<Preloader full />}>
      <Routes>
        <Route element={<ClinicLayout />}>
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
