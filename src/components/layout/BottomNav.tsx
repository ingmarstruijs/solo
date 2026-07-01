import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Dumbbell, Package, Play, Square } from 'lucide-react'
import { useMemo } from 'react'
import { useActiveSession } from '@/hooks/useActiveSession'
import { useLocker } from '@/hooks/useLocker'
import { useRecoveryScore } from '@/hooks/useRecoveryScore'
import { useSessionActions } from '@/hooks/useSessionActions'
import { useTheme } from '@/hooks/useTheme'
import { useWorkoutSelection } from '@/hooks/useWorkoutSelection'
import { prepareWorkouts } from '@/lib/workout/sessionPrep'
import { startSessionFromPrep } from '@/lib/workout/startSessionFromPrep'
import { clearLastSummary } from '@/lib/workout/sessionSummary'
import { publishTvIdle } from '@/lib/tv/transport'
import { bottomNav } from '@/config/nav'
import { resolveCenterNav } from '@/components/layout/centerNavState'
import { cn } from '@/lib/cn'

const variantClasses: Record<
  ReturnType<typeof resolveCenterNav>['variant'],
  string
> = {
  primary: 'border-ink bg-solo-400 shadow-solo-600/30',
  prep: 'border-solo-400 bg-solo-400 shadow-solo-600/30',
  success: 'border-success bg-success shadow-success/30 ring-4 ring-success/25 animate-pulse',
  danger: 'border-danger bg-danger text-ink shadow-danger/30',
  wait: 'border-warn/50 bg-warn/20 text-warn shadow-warn/20',
  muted: 'border-line bg-surface-2 text-muted shadow-none',
}

const badgeClasses: Record<ReturnType<typeof resolveCenterNav>['variant'], string> = {
  primary: 'bg-surface-2 text-muted',
  prep: 'bg-surface-2 text-fg',
  success: 'bg-success text-ink',
  danger: 'bg-danger text-ink',
  wait: 'bg-warn/20 text-warn',
  muted: 'bg-surface-2 text-faint',
}

export function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session, active } = useActiveSession()
  const { cancelSession } = useSessionActions()
  const { theme } = useTheme()
  const { items: lockerItems } = useLocker()
  const { score: recoveryScore } = useRecoveryScore()
  const { selectionMode, selectedCount, selectedIds } = useWorkoutSelection()
  const onPrep = location.pathname === '/workouts/prep'

  const prepIds = useMemo(() => {
    if (!onPrep) return []
    const raw = new URLSearchParams(location.search).get('ids') ?? ''
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
  }, [onPrep, location.search])

  const prepReady = useMemo(() => {
    if (!onPrep || prepIds.length === 0) return false
    const prep = prepareWorkouts(prepIds, lockerItems, recoveryScore)
    return Boolean(prep && prep.workouts.length > 0)
  }, [onPrep, prepIds, lockerItems, recoveryScore])

  const center = resolveCenterNav({
    pathname: location.pathname,
    active,
    session,
    selectionMode,
    selectedCount,
    prepReady,
  })

  const left = bottomNav.slice(0, 2)
  const right = bottomNav.slice(2, 4)

  function onCenterClick() {
    if (center.disabled) return

    if (location.pathname === '/session/summary') {
      clearLastSummary()
      publishTvIdle(theme)
      navigate('/workouts')
      return
    }

    if (active && session) {
      const started = session.exercisesStarted ?? Boolean(session.currentExerciseStartedAt)
      if (!started) {
        navigate('/session')
        return
      }
      if (location.pathname === '/session') {
        if (!confirm('Sessie afbreken? Deze workout wordt niet opgeslagen.')) return
        publishTvIdle(theme)
        cancelSession()
        navigate('/workouts')
        return
      }
      navigate('/session')
      return
    }

    if (onPrep && prepReady) {
      const prep = prepareWorkouts(prepIds, lockerItems, recoveryScore)
      if (prep) {
        startSessionFromPrep(prep, theme)
        navigate('/session')
      }
      return
    }

    if (selectionMode && selectedIds.length > 0) {
      navigate(`/workouts/prep?ids=${selectedIds.join(',')}`)
      return
    }
  }

  const CenterIcon =
    center.icon === 'stop' ? Square : center.icon === 'package' ? Package : center.icon === 'dumbbell' ? Dumbbell : Play

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink/90 backdrop-blur-md">
      <div className="relative grid h-[var(--bottomnav-h)] grid-cols-5 items-center">
        {left.map((item) => (
          <NavItemLink key={item.to} {...item} />
        ))}

        <div className="flex flex-col items-center justify-center">
          <button
            type="button"
            onClick={onCenterClick}
            disabled={center.disabled}
            aria-label={center.label || 'Workouts'}
            className={cn(
              '-mt-8 grid size-16 place-items-center rounded-full border-4 shadow-lg transition-transform',
              variantClasses[center.variant],
              center.disabled ? 'cursor-not-allowed opacity-55' : 'active:scale-95',
            )}
          >
            {center.showCount != null ? (
              <span className="text-lg font-bold tabular-nums text-ink">{center.showCount}</span>
            ) : (
              <CenterIcon
                className={cn(
                  'size-7',
                  center.icon === 'play' && center.variant === 'success' && 'translate-x-0.5 fill-ink',
                  center.icon === 'play' && center.variant !== 'success' && 'fill-ink',
                  center.icon === 'stop' && 'fill-ink',
                )}
              />
            )}
          </button>
          {center.label ? (
            <span
              className={cn(
                'absolute -mt-[4.75rem] rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                badgeClasses[center.variant],
              )}
            >
              {center.label}
            </span>
          ) : null}
        </div>

        {right.map((item) => (
          <NavItemLink key={item.to} {...item} />
        ))}
      </div>
    </nav>
  )
}

function NavItemLink({
  to,
  label,
  icon: Icon,
}: (typeof bottomNav)[number]) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex h-full flex-col items-center justify-center gap-1 transition-colors',
          isActive ? 'text-solo-400' : 'text-muted active:text-fg',
        )
      }
    >
      <Icon className="size-6" />
      <span className="text-[0.65rem] font-medium tracking-wide">{label}</span>
    </NavLink>
  )
}
