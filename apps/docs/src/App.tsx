import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthPage } from './components/AuthPage'
import { BoardPage } from './components/BoardPage'
import { DocPageView } from './components/DocPageView'
import { HomePage } from './components/HomePage'
import { Layout } from './components/Layout'

/** Старые URL *.html со статичного портала → SPA-маршруты */
const legacyRedirects: Record<string, string> = {
  'index.html': '/',
  'roadmap.html': '/roadmap',
  'project-for-devs.html': '/project-for-devs',
  'mobile.html': '/mobile',
  'rustore-app.html': '/rustore-app',
  'booking-for-clinic.html': '/booking-for-clinic',
  'phase-5-appointments.html': '/phase-5-appointments',
  'audit.html': '/',
  'design-brief.html': '/',
  'sales.html': '/sales',
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<AuthPage />} />
        <Route path="board" element={<BoardPage />} />
        {Object.entries(legacyRedirects).map(([from, to]) => (
          <Route key={from} path={from} element={<Navigate to={to} replace />} />
        ))}
        <Route path=":slug" element={<DocPageView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
