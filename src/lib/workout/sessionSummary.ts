import type { ActiveSession, SetMetric } from '@/types/workout'
import { formatElapsedSeconds } from '@/hooks/useElapsedTimer'
import { i18n } from '@/i18n'
import { getPhaseInfo } from '@/lib/workout/workoutStructure'

export type ExerciseTrend = 'faster' | 'slower' | 'stable'

export type SessionSummaryExercise = {
  name: string
  metric: SetMetric
  durationSeconds: number
  durationsBySet: number[]
  avgPerSet: number
  trend: ExerciseTrend
  trendPercent: number
}

export type SessionSummarySet = {
  setNumber: number
  label: string
  durationSeconds: number
  exercises: { name: string; durationSeconds: number }[]
  /** Optional RPE (1–10) logged after this set/round. */
  rpe?: number
}

export type SessionSummaryStats = {
  phaseLabel: string
  totalSets: number
  totalExercisesCompleted: number
  avgSetDurationSeconds: number
  avgExercisePerSetSeconds: number
  fastestSet: { setNumber: number; seconds: number } | null
  slowestSet: { setNumber: number; seconds: number } | null
  fastestExercise: { name: string; avgSeconds: number } | null
  slowestExercise: { name: string; avgSeconds: number } | null
  paceChangePercent: number
  paceLabel: string
  /** Average of logged RPE values, or null when none were logged. */
  avgRpe: number | null
}

export type SessionSummary = {
  workoutName: string
  exercises: SessionSummaryExercise[]
  sets: SessionSummarySet[]
  stats: SessionSummaryStats
  /** Set/round number → RPE (1–10). */
  rpeBySet: Record<number, number>
  totalDurationSeconds: number
  startedAt: string
  completedAt: string
  /** Optional on-device TinyLLM coaching report. */
  aiReport?: string
  aiReportModel?: string
  aiReportAt?: string
}

const SUMMARY_KEY = 'solo-last-summary'

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return formatElapsedSeconds(seconds)
}

function computeTrend(first: number, last: number): { trend: ExerciseTrend; trendPercent: number } {
  if (first <= 0 || last <= 0) return { trend: 'stable', trendPercent: 0 }
  const pct = Math.round(((last - first) / first) * 100)
  if (pct >= 10) return { trend: 'slower', trendPercent: pct }
  if (pct <= -10) return { trend: 'faster', trendPercent: pct }
  return { trend: 'stable', trendPercent: pct }
}

/** Average of logged 1–10 RPE values, or null when empty. */
export function averageRpe(rpeBySet: Record<number, number> | undefined): number | null {
  if (!rpeBySet) return null
  const values = Object.values(rpeBySet).filter((value) => value >= 1 && value <= 10)
  if (values.length === 0) return null
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
}

function finalizeSetWallDurations(session: ActiveSession): Record<number, number> {
  const allDone = session.completedExerciseIds.length === session.workout.exercises.length
  if (!allDone) return { ...(session.setWallDurations ?? {}) }

  const existing = session.setWallDurations ?? {}
  if (existing[session.currentSet] != null) return existing

  const start = session.currentSetStartedAt ?? session.startedAt
  const wall = Math.max(1, Math.floor((Date.now() - new Date(start).getTime()) / 1000))
  return { ...existing, [session.currentSet]: wall }
}

export function buildSessionSummary(session: ActiveSession): SessionSummary {
  const phase = getPhaseInfo(session.workout)
  const bySet = session.exerciseDurationsBySet ?? {}
  const setWallDurations = finalizeSetWallDurations(session)

  const setNumbers = [
    ...new Set([
      ...Object.keys(setWallDurations).map(Number),
      ...Object.keys(bySet).map(Number),
      session.currentSet,
    ]),
  ]
    .filter((n) => n > 0)
    .sort((a, b) => a - b)

  const sets: SessionSummarySet[] = setNumbers.map((num) => {
    const exerciseRows = session.workout.exercises.map((ex) => ({
      name: ex.name,
      durationSeconds: bySet[num]?.[ex.id] ?? 0,
    }))
    const exerciseSum = exerciseRows.reduce((sum, row) => sum + row.durationSeconds, 0)
    const rpe = session.rpeBySet?.[num]
    return {
      setNumber: num,
      label: `${phase.label} ${num}`,
      durationSeconds: setWallDurations[num] ?? exerciseSum,
      exercises: exerciseRows,
      ...(rpe != null ? { rpe } : {}),
    }
  })

  const exercises: SessionSummaryExercise[] = session.workout.exercises.map((ex) => {
    const durationsBySet = setNumbers.map((n) => bySet[n]?.[ex.id] ?? 0)
    const total = durationsBySet.reduce((sum, value) => sum + value, 0)
    const measured = durationsBySet.filter((value) => value > 0)
    const avgPerSet = measured.length > 0 ? Math.round(total / measured.length) : 0
    const first = durationsBySet.find((value) => value > 0) ?? 0
    const last = [...durationsBySet].reverse().find((value) => value > 0) ?? 0
    const { trend, trendPercent } =
      setNumbers.length > 1 ? computeTrend(first, last) : { trend: 'stable' as const, trendPercent: 0 }

    return {
      name: ex.name,
      metric: ex.metric,
      durationSeconds: session.exerciseDurations?.[ex.id] ?? total,
      durationsBySet,
      avgPerSet,
      trend,
      trendPercent,
    }
  })

  const setDurations = sets.map((set) => set.durationSeconds).filter((value) => value > 0)
  const avgSetDurationSeconds =
    setDurations.length > 0
      ? Math.round(setDurations.reduce((sum, value) => sum + value, 0) / setDurations.length)
      : 0

  const exerciseAvgs = exercises
    .filter((ex) => ex.avgPerSet > 0)
    .map((ex) => ({ name: ex.name, avgSeconds: ex.avgPerSet }))

  const fastestSet =
    setDurations.length > 0
      ? sets.reduce(
          (best, set) =>
            set.durationSeconds > 0 && set.durationSeconds < best.seconds
              ? { setNumber: set.setNumber, seconds: set.durationSeconds }
              : best,
          { setNumber: sets[0]?.setNumber ?? 1, seconds: setDurations[0] ?? 0 },
        )
      : null

  const slowestSet =
    setDurations.length > 0
      ? sets.reduce(
          (best, set) =>
            set.durationSeconds > best.seconds
              ? { setNumber: set.setNumber, seconds: set.durationSeconds }
              : best,
          { setNumber: sets[0]?.setNumber ?? 1, seconds: 0 },
        )
      : null

  const fastestExercise =
    exerciseAvgs.length > 0
      ? exerciseAvgs.reduce((best, row) => (row.avgSeconds < best.avgSeconds ? row : best))
      : null

  const slowestExercise =
    exerciseAvgs.length > 0
      ? exerciseAvgs.reduce((best, row) => (row.avgSeconds > best.avgSeconds ? row : best))
      : null

  const firstSetAvg =
    sets.length > 0
      ? Math.round(
          sets[0].exercises.reduce((sum, row) => sum + row.durationSeconds, 0) /
            Math.max(1, sets[0].exercises.filter((row) => row.durationSeconds > 0).length),
        )
      : 0
  const lastSetAvg =
    sets.length > 0
      ? Math.round(
          sets[sets.length - 1].exercises.reduce((sum, row) => sum + row.durationSeconds, 0) /
            Math.max(
              1,
              sets[sets.length - 1].exercises.filter((row) => row.durationSeconds > 0).length,
            ),
        )
      : 0
  const paceChangePercent =
    firstSetAvg > 0 && lastSetAvg > 0
      ? Math.round(((lastSetAvg - firstSetAvg) / firstSetAvg) * 100)
      : 0

  let paceLabel = i18n.t('session:paceStable')
  if (paceChangePercent >= 10) {
    paceLabel = i18n.t('session:paceSlower', { percent: paceChangePercent })
  } else if (paceChangePercent <= -10) {
    paceLabel = i18n.t('session:paceFaster', { percent: Math.abs(paceChangePercent) })
  }

  const totalDurationSeconds = Math.max(
    1,
    Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000),
  )

  const allExerciseTimes = exercises.flatMap((ex) => ex.durationsBySet).filter((value) => value > 0)
  const avgExercisePerSetSeconds =
    allExerciseTimes.length > 0
      ? Math.round(allExerciseTimes.reduce((sum, value) => sum + value, 0) / allExerciseTimes.length)
      : 0

  const rpeBySet = { ...(session.rpeBySet ?? {}) }
  const avgRpe = averageRpe(rpeBySet)

  return {
    workoutName: session.workout.name,
    exercises,
    sets,
    stats: {
      phaseLabel: phase.label,
      totalSets: sets.length,
      totalExercisesCompleted: allExerciseTimes.length,
      avgSetDurationSeconds,
      avgExercisePerSetSeconds,
      fastestSet,
      slowestSet,
      fastestExercise,
      slowestExercise,
      paceChangePercent,
      paceLabel,
      avgRpe,
    },
    rpeBySet,
    totalDurationSeconds,
    startedAt: session.startedAt,
    completedAt: new Date().toISOString(),
  }
}

export function saveLastSummary(summary: SessionSummary, hasNextWorkout: boolean): void {
  sessionStorage.setItem(
    SUMMARY_KEY,
    JSON.stringify({ summary, hasNextWorkout, savedAt: new Date().toISOString() }),
  )
}

export function normalizeSummary(raw: Partial<SessionSummary> & { workoutName: string }): SessionSummary {
  const rpeBySet = raw.rpeBySet ?? {}
  const avgRpe = raw.stats?.avgRpe ?? averageRpe(rpeBySet)

  if (raw.stats && raw.sets && raw.exercises?.every((ex) => 'durationsBySet' in ex)) {
    return {
      ...(raw as SessionSummary),
      rpeBySet,
      stats: {
        ...raw.stats,
        avgRpe,
      },
      sets: raw.sets.map((set) => ({
        ...set,
        ...(set.rpe == null && rpeBySet[set.setNumber] != null
          ? { rpe: rpeBySet[set.setNumber] }
          : {}),
      })),
    }
  }

  const exercises: SessionSummaryExercise[] = (raw.exercises ?? []).map((ex) => {
    const durationSeconds = 'durationSeconds' in ex ? ex.durationSeconds : 0
    return {
    name: ex.name,
    metric: 'metric' in ex ? ex.metric : 'reps',
    durationSeconds,
    durationsBySet: 'durationsBySet' in ex ? ex.durationsBySet : [],
    avgPerSet: 'avgPerSet' in ex ? ex.avgPerSet : durationSeconds,
    trend: 'trend' in ex ? ex.trend : 'stable',
    trendPercent: 'trendPercent' in ex ? ex.trendPercent : 0,
  }
  })

  return {
    workoutName: raw.workoutName,
    exercises,
    sets: (raw.sets ?? []).map((set) => ({
      ...set,
      ...(set.rpe == null && rpeBySet[set.setNumber] != null
        ? { rpe: rpeBySet[set.setNumber] }
        : {}),
    })),
    stats: {
      phaseLabel: raw.stats?.phaseLabel ?? i18n.t('common:set'),
      totalSets: raw.stats?.totalSets ?? raw.sets?.length ?? 0,
      totalExercisesCompleted: raw.stats?.totalExercisesCompleted ?? exercises.length,
      avgSetDurationSeconds: raw.stats?.avgSetDurationSeconds ?? 0,
      avgExercisePerSetSeconds:
        raw.stats?.avgExercisePerSetSeconds ??
        (exercises.length > 0
          ? Math.round(
              exercises.reduce((sum, ex) => sum + ex.durationSeconds, 0) / exercises.length,
            )
          : 0),
      fastestSet: raw.stats?.fastestSet ?? null,
      slowestSet: raw.stats?.slowestSet ?? null,
      fastestExercise: raw.stats?.fastestExercise ?? null,
      slowestExercise: raw.stats?.slowestExercise ?? null,
      paceChangePercent: raw.stats?.paceChangePercent ?? 0,
      paceLabel: raw.stats?.paceLabel ?? i18n.t('session:paceStable'),
      avgRpe,
    },
    rpeBySet,
    totalDurationSeconds: raw.totalDurationSeconds ?? 0,
    startedAt: raw.startedAt ?? new Date().toISOString(),
    completedAt: raw.completedAt ?? new Date().toISOString(),
    ...(raw.aiReport ? { aiReport: raw.aiReport } : {}),
    ...(raw.aiReportModel ? { aiReportModel: raw.aiReportModel } : {}),
    ...(raw.aiReportAt ? { aiReportAt: raw.aiReportAt } : {}),
  }
}

export function loadLastSummary(): {
  summary: SessionSummary
  hasNextWorkout: boolean
} | null {
  try {
    const raw = sessionStorage.getItem(SUMMARY_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as {
      summary: SessionSummary
      hasNextWorkout: boolean
    }
    if (!parsed.summary?.workoutName) return null
    return {
      hasNextWorkout: parsed.hasNextWorkout,
      summary: normalizeSummary(parsed.summary),
    }
  } catch {
    return null
  }
}

export function clearLastSummary(): void {
  sessionStorage.removeItem(SUMMARY_KEY)
}
