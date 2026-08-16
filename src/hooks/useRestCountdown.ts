import { useEffect, useState } from 'react'
import { i18n } from '@/i18n'

export type RestTimerKind = 'exercise' | 'phase'

export type RestTimer = {
  id: string
  endsAt: number
  totalSeconds: number
  afterExerciseName: string
  kind?: RestTimerKind
  phaseLabel?: string
  /** Set/ronde number just completed (phase rest only). */
  completedPhase?: number
  /** Exercise that starts when rest ends (same set or first of next set). */
  nextExerciseName?: string
  nextExerciseTarget?: string
}

export type RestCountdown = {
  active: boolean
  remaining: number
  total: number
  progress: number
  afterExerciseName: string
  kind: RestTimerKind
  phaseLabel?: string
  completedPhase?: number
  nextExerciseName?: string
  nextExerciseTarget?: string
}

const IDLE: RestCountdown = {
  active: false,
  remaining: 0,
  total: 0,
  progress: 0,
  afterExerciseName: '',
  kind: 'exercise',
}

function isRoundPhase(phaseLabel?: string): boolean {
  if (!phaseLabel) return false
  return phaseLabel === i18n.t('common:round') || phaseLabel === 'Ronde'
}

export function useRestCountdown(timer: RestTimer | null): RestCountdown {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!timer) return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(id)
  }, [timer])

  if (!timer) return IDLE

  const remaining = Math.max(0, Math.ceil((timer.endsAt - now) / 1000))
  const progress =
    timer.totalSeconds > 0 ? Math.min(1, remaining / timer.totalSeconds) : 0

  return {
    active: remaining > 0,
    remaining,
    total: timer.totalSeconds,
    progress,
    afterExerciseName: timer.afterExerciseName,
    kind: timer.kind ?? 'exercise',
    phaseLabel: timer.phaseLabel,
    completedPhase: timer.completedPhase,
    nextExerciseName: timer.nextExerciseName,
    nextExerciseTarget: timer.nextExerciseTarget,
  }
}

export function restCountdownTitle(
  countdown: Pick<RestCountdown, 'kind' | 'phaseLabel'>,
): string {
  if (countdown.kind === 'phase') {
    return isRoundPhase(countdown.phaseLabel)
      ? i18n.t('session:restTitleRound')
      : i18n.t('session:restTitleSet')
  }
  return i18n.t('session:restTitle')
}

export function restCountdownSubtitle(
  countdown: Pick<
    RestCountdown,
    'kind' | 'phaseLabel' | 'afterExerciseName' | 'completedPhase'
  >,
): string {
  if (countdown.kind === 'phase') {
    const n = countdown.completedPhase
    if (isRoundPhase(countdown.phaseLabel)) {
      return n != null
        ? i18n.t('session:restRoundDone', { n, next: n + 1 })
        : i18n.t('session:restBetweenRounds')
    }
    return n != null
      ? i18n.t('session:restSetDone', { n, next: n + 1 })
      : i18n.t('session:restBetweenSets')
  }
  return i18n.t('session:restAfter', { name: countdown.afterExerciseName })
}

/** Label above the upcoming exercise on the rest overlay. */
export function restNextExerciseLabel(
  countdown: Pick<RestCountdown, 'kind' | 'phaseLabel' | 'completedPhase'>,
): string {
  if (countdown.kind === 'phase') {
    const n = countdown.completedPhase
    if (n != null) {
      return isRoundPhase(countdown.phaseLabel)
        ? i18n.t('session:restNextRound', { n: n + 1 })
        : i18n.t('session:restNextSet', { n: n + 1 })
    }
    return i18n.t('session:restNext')
  }
  return i18n.t('session:restNextExercise')
}

export function formatRestSeconds(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return s > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${m}m`
  }
  return `${seconds}s`
}
