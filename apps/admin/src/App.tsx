import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './shared/config/AuthContext';
import { NotificationProvider } from './shared/ui/Notification/NotificationContext';
import { ProtectedRoute } from './shared/ui/ProtectedRoute';
import { Loader } from './shared/ui/Loader';

/** Контент (статьи, врачи…) — admin и editor */
function ContentRoute() {
  const { user } = useAuth();
  if (user?.role === 'groomer') return <Navigate to="/grooming" replace />;
  if (user?.role === 'manager') return <Navigate to="/booking" replace />;
  return <Outlet />;
}

/** Запись на приём — admin и manager */
function BookingRoute() {
  const { user } = useAuth();
  if (user?.role === 'groomer') return <Navigate to="/grooming" replace />;
  if (user?.role === 'editor') return <Navigate to="/animals" replace />;
  return <Outlet />;
}

function GroomingRoute() {
  const { user } = useAuth();
  if (user?.role === 'manager') return <Navigate to="/booking" replace />;
  return <Outlet />;
}

function DefaultRedirect() {
  const { user } = useAuth();
  if (user?.role === 'groomer') return <Navigate to="/grooming" replace />;
  if (user?.role === 'manager') return <Navigate to="/booking" replace />;
  if (user?.role === 'admin') return <Navigate to="/dashboard" replace />;
  return <Navigate to="/animals" replace />;
}

const LoginScreen = lazy(() => import('./screens/LoginScreen').then((m) => ({ default: m.LoginScreen })));
const AnimalsScreen = lazy(() => import('./screens/AnimalsScreen').then((m) => ({ default: m.AnimalsScreen })));
const ArticlesScreen = lazy(() => import('./screens/ArticlesScreen').then((m) => ({ default: m.ArticlesScreen })));
const ArticleEditorScreen = lazy(() => import('./screens/ArticleEditorScreen').then((m) => ({ default: m.ArticleEditorScreen })));
const UsersScreen = lazy(() => import('./screens/UsersScreen').then((m) => ({ default: m.UsersScreen })));
const DoctorsScreen = lazy(() => import('./screens/DoctorsScreen').then((m) => ({ default: m.DoctorsScreen })));
const DoctorEditorScreen = lazy(() => import('./screens/DoctorEditorScreen').then((m) => ({ default: m.DoctorEditorScreen })));
const ScheduleScreen = lazy(() => import('./screens/ScheduleScreen').then((m) => ({ default: m.ScheduleScreen })));
const GroomingScreen = lazy(() => import('./screens/GroomingScreen').then((m) => ({ default: m.GroomingScreen })));
const ClinicInfoScreen = lazy(() => import('./screens/ClinicInfoScreen').then((m) => ({ default: m.ClinicInfoScreen })));
const DashboardScreen = lazy(() => import('./screens/DashboardScreen').then((m) => ({ default: m.DashboardScreen })));
const BookingScreen = lazy(() =>
  import('./screens/BookingScreen').then((m) => ({ default: m.BookingScreen })),
);

const router = createBrowserRouter([
  { path: '/login', element: <Suspense fallback={<Loader />}><LoginScreen /></Suspense> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <BookingRoute />,
        children: [
          {
            path: '/booking',
            element: <Suspense fallback={<Loader />}><BookingScreen /></Suspense>,
          },
          { path: '/booking/services', element: <Navigate to="/booking?tab=services" replace /> },
          { path: '/booking/schedule', element: <Navigate to="/booking?tab=schedule" replace /> },
          { path: '/booking/requests', element: <Navigate to="/booking?tab=requests" replace /> },
          { path: '/booking/settings', element: <Navigate to="/booking?tab=settings" replace /> },
        ],
      },
      {
        element: <ContentRoute />,
        children: [
          { path: '/dashboard', element: <Suspense fallback={<Loader />}><DashboardScreen /></Suspense> },
          { path: '/clinic-info', element: <Suspense fallback={<Loader />}><ClinicInfoScreen /></Suspense> },
          { path: '/animals', element: <Suspense fallback={<Loader />}><AnimalsScreen /></Suspense> },
          { path: '/articles', element: <Suspense fallback={<Loader />}><ArticlesScreen /></Suspense> },
          { path: '/articles/new', element: <Suspense fallback={<Loader />}><ArticleEditorScreen /></Suspense> },
          { path: '/articles/:id/edit', element: <Suspense fallback={<Loader />}><ArticleEditorScreen /></Suspense> },
          { path: '/users', element: <Suspense fallback={<Loader />}><UsersScreen /></Suspense> },
          { path: '/doctors', element: <Suspense fallback={<Loader />}><DoctorsScreen /></Suspense> },
          { path: '/doctors/new', element: <Suspense fallback={<Loader />}><DoctorEditorScreen /></Suspense> },
          { path: '/doctors/:id/edit', element: <Suspense fallback={<Loader />}><DoctorEditorScreen /></Suspense> },
          { path: '/schedule', element: <Suspense fallback={<Loader />}><ScheduleScreen /></Suspense> },
        ],
      },
      {
        element: <GroomingRoute />,
        children: [
          { path: '/grooming', element: <Suspense fallback={<Loader />}><GroomingScreen /></Suspense> },
        ],
      },
    ],
  },
  { path: '*', element: <DefaultRedirect /> },
]);

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <RouterProvider router={router} />
      </NotificationProvider>
    </AuthProvider>
  );
}
