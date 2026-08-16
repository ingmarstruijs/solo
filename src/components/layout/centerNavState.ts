import type { ActiveSession } from '@/types/workout'

export type CenterNavVariant = 'primary' | 'success' | 'danger' | 'wait' | 'muted' | 'prep'

export type CenterNavLabelKey =
  | 'center.prepare'
  | 'center.stop'
  | 'center.live'
  | 'center.workouts'
  | 'center.choose'
  | 'center.prepCount'
  | null

export type CenterNavConfig = {
  labelKey: CenterNavLabelKey
  labelCount?: number
  disabled: boolean
  variant: CenterNavVariant
  showCount: number | null
  icon: 'play' | 'stop' | 'dumbbell' | 'package' | 'solo'
}

type ResolveCenterNavInput = {
  pathname: string
  active: boolean
  session: ActiveSession | null
  selectionMode: boolean
  selectedCount: number
  prepReady: boolean
}

function exercisesStarted(session: ActiveSession | null): boolean {
  if (!session) return false
  return session.exercisesStarted ?? Boolean(session.currentExerciseStartedAt)
}

const IDLE_BOTTOM_TABS = ['/', '/locker', '/history'] as const

function isIdleBottomTab(pathname: string): boolean {
  return (IDLE_BOTTOM_TABS as readonly string[]).includes(pathname)
}

/** SOLO icon, muted look — disabled idle state. */
function mutedDisabled(icon: CenterNavConfig['icon'] = 'solo'): CenterNavConfig {
  return {
    labelKey: null,
    disabled: true,
    variant: 'muted',
    showCount: null,
    icon,
  }
}

export function resolveCenterNav({
  pathname,
  active,
  session,
  selectionMode,
  selectedCount,
  prepReady,
}: ResolveCenterNavInput): CenterNavConfig {
  const onWorkouts = pathname === '/workouts'
  const onPrep = pathname === '/workouts/prep'
  const onSession = pathname === '/session'
  const onSummary = pathname === '/session/summary'
  const started = exercisesStarted(session)

  if (onSummary) {
    return {
      labelKey: 'center.workouts',
      disabled: false,
      variant: 'primary',
      showCount: null,
      icon: 'dumbbell',
    }
  }

  if (active && session) {
    if (!started) {
      if (onSession) {
        return {
          labelKey: 'center.prepare',
          disabled: true,
          variant: 'wait',
          showCount: null,
          icon: 'package',
        }
      }
      return mutedDisabled()
    }

    if (onSession) {
      return {
        labelKey: 'center.stop',
        disabled: false,
        variant: 'danger',
        showCount: null,
        icon: 'stop',
      }
    }

    return {
      labelKey: 'center.live',
      disabled: false,
      variant: 'success',
      showCount: null,
      icon: 'play',
    }
  }

  if (onPrep) {
    return {
      labelKey: prepReady ? 'center.prepare' : null,
      disabled: !prepReady,
      variant: prepReady ? 'prep' : 'muted',
      showCount: null,
      icon: 'play',
    }
  }

  if (selectionMode && selectedCount > 0) {
    return {
      labelKey: 'center.prepCount',
      labelCount: selectedCount,
      disabled: false,
      variant: 'prep',
      showCount: selectedCount,
      icon: 'play',
    }
  }

  if (selectionMode && selectedCount === 0) {
    return {
      labelKey: 'center.choose',
      disabled: true,
      variant: 'muted',
      showCount: null,
      icon: 'play',
    }
  }

  if (!active && (onWorkouts || isIdleBottomTab(pathname))) {
    return mutedDisabled()
  }

  return mutedDisabled()
}
