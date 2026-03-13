import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/ui/Layout'
import DashboardPage from '@/pages/DashboardPage'
import OutreachPage from '@/pages/OutreachPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/outreach" element={<OutreachPage />} />
      </Route>
    </Routes>
  )
}
