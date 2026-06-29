import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { MobileShell } from '@/components/layout/MobileShell'
import { AboutPage } from '@/pages/AboutPage'
import { ActiveSetLabPage } from '@/pages/ActiveSetLabPage'
import { CanvasCompositeLabPage } from '@/pages/CanvasCompositeLabPage'
import { CastStreamLabPage } from '@/pages/CastStreamLabPage'
import { GarminFeasibilityPage } from '@/pages/GarminFeasibilityPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { HomePage } from '@/pages/HomePage'
import { IntegrationsPage } from '@/pages/IntegrationsPage'
import { LabHubPage } from '@/pages/LabHubPage'
import { LockerPage } from '@/pages/LockerPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PoseLabPage } from '@/pages/PoseLabPage'
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
          <Route path="lab" element={<LabHubPage />} />
          <Route path="lab/active-set" element={<ActiveSetLabPage />} />
          <Route path="lab/garmin-sync" element={<GarminFeasibilityPage />} />
          <Route path="lab/pose" element={<PoseLabPage />} />
          <Route path="lab/canvas-composite" element={<CanvasCompositeLabPage />} />
          <Route path="lab/cast-stream" element={<CastStreamLabPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
