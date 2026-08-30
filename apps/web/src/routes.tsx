import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/shell/AppShell';
import { GroomingGuard } from './components/GroomingGuard';
import { Preloader } from './components/Preloader';
import { ClinicLayout } from './layouts/ClinicLayout';
import HomeScreen from './screens/HomeScreen';
import BookingHubScreen from './screens/booking/BookingHubScreen';
import BookingServicesScreen from './screens/booking/BookingServicesScreen';
import BookingDateScreen from './screens/booking/BookingDateScreen';
import BookingFormScreen from './screens/booking/BookingFormScreen';
import BookingRequestsScreen from './screens/booking/BookingRequestsScreen';
import AnimalsScreen from './screens/content/AnimalsScreen';
import ArticlesScreen from './screens/content/ArticlesScreen';
import ArticleScreen from './screens/content/ArticleScreen';
import DoctorsScreen from './screens/content/DoctorsScreen';
import DoctorScreen from './screens/content/DoctorScreen';
import ScheduleScreen from './screens/content/ScheduleScreen';
import GroomingScreen from './screens/content/GroomingScreen';
import GroomingBreedsScreen from './screens/content/GroomingBreedsScreen';
import GroomingScheduleScreen from './screens/content/GroomingScheduleScreen';
import GroomingBookScreen from './screens/grooming/GroomingBookScreen';
import GroomingMyScreen from './screens/grooming/GroomingMyScreen';
import QuestionScreen from './screens/content/QuestionScreen';
import ProfileScreen from './screens/profile/ProfileScreen';
import StaffBookingInboxScreen from './screens/staff/StaffBookingInboxScreen';
import StaffGroomingDayScreen from './screens/staff/StaffGroomingDayScreen';
import ChatsListScreen from './screens/chats/ChatsListScreen';
import ChatRoomScreen from './screens/chats/ChatRoomScreen';

const LoginScreen = lazy(() => import('./screens/auth/LoginScreen'));
const StaffLoginScreen = lazy(() => import('./screens/auth/StaffLoginScreen'));
const VerifyScreen = lazy(() => import('./screens/auth/VerifyScreen'));
const LinkTelegramScreen = lazy(() => import('./screens/auth/LinkTelegramScreen'));

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
            <Route path="grooming/book" element={<GroomingBookScreen />} />
            <Route path="grooming/requests" element={<GroomingMyScreen />} />
            <Route path="question" element={<QuestionScreen />} />
            <Route path="chats" element={<ChatsListScreen />} />
            <Route path="chats/:roomId" element={<ChatRoomScreen />} />
            <Route path="profile" element={<ProfileScreen />} />
            <Route path="booking" element={<BookingHubScreen />} />
            <Route path="booking/new" element={<BookingServicesScreen />} />
            <Route path="booking/new/:serviceId/date" element={<BookingDateScreen />} />
            <Route path="booking/new/:serviceId/date/:date" element={<BookingFormScreen />} />
            <Route path="booking/requests" element={<BookingRequestsScreen />} />
            <Route path="staff/booking" element={<StaffBookingInboxScreen />} />
            <Route path="staff/grooming" element={<StaffGroomingDayScreen />} />
            <Route path="auth/login" element={<LoginScreen />} />
            <Route path="auth/staff" element={<StaffLoginScreen />} />
            <Route path="auth/verify" element={<VerifyScreen />} />
            <Route path="auth/link-telegram" element={<LinkTelegramScreen />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
