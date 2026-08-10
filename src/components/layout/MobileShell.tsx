import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { useAutoThemeWatcher } from '@/hooks/useTheme'
import { useCancelSetupOnLeave } from '@/hooks/useCancelSetupOnLeave'
import { AppHeader } from './AppHeader'
import { BottomNav } from './BottomNav'
import { Drawer } from './Drawer'

export function MobileShell() {
  useAutoThemeWatcher()
  useCancelSetupOnLeave()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-dvh bg-ink">
      <AppHeader onMenuClick={() => setDrawerOpen(true)} />

      <main className="mx-auto w-full max-w-screen-sm px-4 pt-[calc(var(--header-h)+env(safe-area-inset-top))] pb-[calc(var(--bottomnav-h)+env(safe-area-inset-bottom)+1rem)]">
        <Outlet />
      </main>

      <BottomNav />
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
