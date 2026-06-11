import { Navigate, Route, Routes } from 'react-router-dom'
import { BoardPage } from './components/BoardPage'
import { DocPageView } from './components/DocPageView'
import { HomePage } from './components/HomePage'
import { Layout } from './components/Layout'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="board" element={<BoardPage />} />
        <Route path=":slug" element={<DocPageView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
