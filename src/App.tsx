import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { MobileShell } from '@/components/layout/MobileShell'
import { AboutPage } from '@/pages/AboutPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { HomePage } from '@/pages/HomePage'
import { IntegrationsPage } from '@/pages/IntegrationsPage'
import { LockerPage } from '@/pages/LockerPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { SessionPage } from '@/pages/SessionPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { TvPage } from '@/pages/TvPage'
import { WorkoutsPage } from '@/pages/WorkoutsPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* TV: passive 4K surface, rendered without the mobile shell */}
        <Route path="/tv" element={<TvPage />} />

        {/* Mobile app: controller shell with header, drawer and bottom nav */}
        <Route element={<MobileShell />}>
          <Route index element={<HomePage />} />
          <Route path="workouts" element={<WorkoutsPage />} />
          <Route path="locker" element={<LockerPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="session" element={<SessionPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
