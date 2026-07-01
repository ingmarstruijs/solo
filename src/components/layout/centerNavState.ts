import type { ActiveSession } from '@/types/workout'

export type CenterNavVariant = 'primary' | 'success' | 'danger' | 'wait' | 'muted' | 'prep'

export type CenterNavConfig = {
  label: string
  disabled: boolean
  variant: CenterNavVariant
  showCount: number | null
  icon: 'play' | 'stop' | 'dumbbell' | 'package'
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

function mutedDisabled(icon: CenterNavConfig['icon'] = 'dumbbell'): CenterNavConfig {
  return {
    label: '',
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
      label: 'Workouts',
      disabled: false,
      variant: 'primary',
      showCount: null,
      icon: 'dumbbell',
    }
  }

  if (active && session) {
    if (!started) {
      return {
        label: 'Voorbereiden',
        disabled: onSession,
        variant: 'wait',
        showCount: null,
        icon: 'package',
      }
    }

    if (onSession) {
      return {
        label: 'Stop',
        disabled: false,
        variant: 'danger',
        showCount: null,
        icon: 'stop',
      }
    }

    return {
      label: 'Live',
      disabled: false,
      variant: 'success',
      showCount: null,
      icon: 'play',
    }
  }

  if (onPrep) {
    return {
      label: prepReady ? 'Start' : '',
      disabled: !prepReady,
      variant: prepReady ? 'prep' : 'muted',
      showCount: null,
      icon: 'play',
    }
  }

  if (selectionMode && selectedCount > 0) {
    return {
      label: `Prep ${selectedCount}`,
      disabled: false,
      variant: 'prep',
      showCount: selectedCount,
      icon: 'play',
    }
  }

  if (selectionMode && selectedCount === 0) {
    return {
      label: 'Kies',
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
