import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import { clearActiveSession, getActiveSession } from '@/lib/storage/sessionStore'
import { publishTvIdle } from '@/lib/tv/transport'
import type { ActiveSession } from '@/types/workout'

function isSetupPhase(session: ActiveSession): boolean {
  return !(session.exercisesStarted ?? Boolean(session.currentExerciseStartedAt))
}

function cancelSetupSession(theme: Parameters<typeof publishTvIdle>[0]): void {
  clearActiveSession()
  publishTvIdle(theme)
}

/** Drop an unfinished setup session when the user leaves `/session`. */
export function useCancelSetupOnLeave(): void {
  const { pathname } = useLocation()
  const { theme } = useTheme()
  const prevPathRef = useRef(pathname)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      if (pathname !== '/session') {
        const session = getActiveSession()
        if (session && isSetupPhase(session)) {
          cancelSetupSession(theme)
        }
      }
      prevPathRef.current = pathname
      return
    }

    const prev = prevPathRef.current
    prevPathRef.current = pathname

    if (prev === '/session' && pathname !== '/session') {
      const session = getActiveSession()
      if (session && isSetupPhase(session)) {
        cancelSetupSession(theme)
      }
    }
  }, [pathname, theme])
}
