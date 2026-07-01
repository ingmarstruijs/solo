import type { ThemeId } from '@/lib/theme/themes'
import { appUrl } from '@/lib/appBase'
import type { SessionSummary } from '@/lib/workout/sessionSummary'
import type { EquipmentCategory } from '@/types/locker'
import type { ExerciseKind, ExerciseMedia, OverloadTarget, SetMetric, WorkoutTemplate } from '@/types/workout'
import { getCoachEnabled } from '@/lib/storage/coachStore'
import { getGarminConnected } from '@/lib/storage/garminStore'
import { computeMockSensor } from '@/lib/tv/coachEngine'
import { computeWorkoutProgress, getPhaseInfo } from '@/lib/workout/workoutStructure'

export const TV_CHANNEL = 'solo-tv-sync'
export const TV_CONTROL_CHANNEL = 'solo-tv-control'
export const TV_WINDOW_NAME = 'solo-tv'

type TvControlMessage =
  | { type: 'ping'; nonce: string }
  | { type: 'pong'; nonce: string }
  | { type: 'hello' }

export type TvSensorState = {
  cameraEnabled: boolean
  garminConnected: boolean
  velocityDropPercent: number
  heartRatePercentMax: number
}

export type TvRestState = {
  active: boolean
  endsAt: string | null
  totalSeconds: number
  afterExerciseName?: string
  kind?: 'exercise' | 'phase'
  phaseLabel?: string
}

export type TvSessionState = {
  mode: 'session'
  theme: ThemeId
  connected: boolean
  workoutName: string
  exerciseIndex: number
  exerciseName: string
  exerciseKind?: ExerciseKind
  metric?: SetMetric
  equipment?: EquipmentCategory[]
  icon?: EquipmentCategory
  exerciseMedia?: ExerciseMedia
  exerciseDescription?: string
  nextExerciseName?: string
  completedCount: number
  totalExercises: number
  setIndex: number
  totalSets: number
  phaseLabel: string
  progressPercent: number
  completedSlots: number
  totalSlots: number
  targetLabel: string
  weightKg?: number
  recoveryScore?: number
  sensor: TvSensorState
  coachEnabled: boolean
  rest: TvRestState
  updatedAt: string
}

export type TvPrepState = {
  mode: 'prep'
  theme: ThemeId
  workouts: { id: string; name: string; exerciseCount: number }[]
  garminConnected: boolean
  recoveryScore?: number
  updatedAt: string
}

export type TvIdleState = {
  mode: 'idle'
  theme: ThemeId
  updatedAt: string
}

export type TvSummaryState = {
  mode: 'summary'
  theme: ThemeId
  updatedAt: string
} & SessionSummary

export type TvMessage = TvSessionState | TvPrepState | TvIdleState | TvSummaryState

export type SessionTvOptions = {
  cameraEnabled?: boolean
  sessionStartedAt?: string
  completedExerciseIds?: string[]
  coachEnabled?: boolean
  rest?: TvRestState | null
}

let tvWindowRef: Window | null = null

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  return new BroadcastChannel(TV_CHANNEL)
}

function getControlChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  return new BroadcastChannel(TV_CONTROL_CHANNEL)
}

/**
 * Controller side: ask any open /tv receivers to answer. Resolves true if at
 * least one receiver responds within the timeout, so we can reconnect to an
 * existing screen instead of opening a duplicate window.
 */
export function pingTvReceiver(timeoutMs = 600): Promise<boolean> {
  const channel = getControlChannel()
  if (!channel) return Promise.resolve(false)

  return new Promise((resolve) => {
    const nonce = Math.random().toString(36).slice(2)
    let settled = false
    const finish = (alive: boolean) => {
      if (settled) return
      settled = true
      channel.removeEventListener('message', handler)
      channel.close()
      resolve(alive)
    }
    const handler = (event: MessageEvent<TvControlMessage>) => {
      const data = event.data
      if (data?.type === 'pong' && data.nonce === nonce) finish(true)
    }
    channel.addEventListener('message', handler)
    channel.postMessage({ type: 'ping', nonce } satisfies TvControlMessage)
    window.setTimeout(() => finish(false), timeoutMs)
  })
}

/**
 * Receiver side (TV page): answer controller pings and announce presence on
 * load so a controller can detect this surface. Returns an unsubscribe fn.
 */
export function announceTvReceiver(): () => void {
  const channel = getControlChannel()
  if (!channel) return () => undefined

  const handler = (event: MessageEvent<TvControlMessage>) => {
    if (event.data?.type === 'ping') {
      channel.postMessage({ type: 'pong', nonce: event.data.nonce } satisfies TvControlMessage)
    }
  }
  channel.addEventListener('message', handler)
  channel.postMessage({ type: 'hello' } satisfies TvControlMessage)

  return () => {
    channel.removeEventListener('message', handler)
    channel.close()
  }
}

/** Controller side: run a callback whenever a receiver announces presence. */
export function onTvReceiverHello(callback: () => void): () => void {
  const channel = getControlChannel()
  if (!channel) return () => undefined

  const handler = (event: MessageEvent<TvControlMessage>) => {
    if (event.data?.type === 'hello') callback()
  }
  channel.addEventListener('message', handler)
  return () => {
    channel.removeEventListener('message', handler)
    channel.close()
  }
}

export function publishTvState(state: TvMessage): void {
  getChannel()?.postMessage(state)
}

export function subscribeTv(onMessage: (state: TvMessage) => void): () => void {
  const channel = getChannel()
  if (!channel) return () => undefined

  const handler = (event: MessageEvent<TvMessage>) => {
    const data = event.data
    if (data && 'mode' in data) onMessage(data)
  }
  channel.addEventListener('message', handler)
  return () => channel.removeEventListener('message', handler)
}

/** Whether the named dev TV window is still open. */
export function isTvWindowOpen(): boolean {
  return tvWindowRef != null && !tvWindowRef.closed
}

/** Close the dev TV window if we still hold a reference to it. */
export function closeTvWindow(): void {
  try {
    if (tvWindowRef && !tvWindowRef.closed) tvWindowRef.close()
  } catch {
    // ignore — cross-origin or already closed
  }
  tvWindowRef = null
}

/** Reuse existing TV window if open; otherwise open a new one. */
export function connectTvWindow(): Window | null {
  if (tvWindowRef && !tvWindowRef.closed) {
    tvWindowRef.focus()
    return tvWindowRef
  }

  const url = appUrl('/tv')
  // Reuse the same named target so the browser won't spawn duplicates, and keep
  // the ref (no noopener) so we can close it again on disconnect.
  tvWindowRef = window.open(url, TV_WINDOW_NAME, 'width=1280,height=720')
  return tvWindowRef
}

export function publishToTv(state: TvMessage, theme: ThemeId): void {
  publishTvState({ ...state, theme })
  connectTvWindow()
}

export function buildPrepTvState(
  workouts: WorkoutTemplate[],
  recoveryScore: number,
  theme: ThemeId,
): TvPrepState {
  const garminConnected = getGarminConnected()
  return {
    mode: 'prep',
    theme,
    workouts: workouts.map((w) => ({
      id: w.id,
      name: w.name,
      exerciseCount: w.exercises.length,
    })),
    garminConnected,
    recoveryScore: garminConnected ? recoveryScore : undefined,
    updatedAt: new Date().toISOString(),
  }
}

export function buildIdleTvState(theme: ThemeId): TvIdleState {
  return {
    mode: 'idle',
    theme,
    updatedAt: new Date().toISOString(),
  }
}

export function buildSummaryTvState(summary: SessionSummary, theme: ThemeId): TvSummaryState {
  return {
    mode: 'summary',
    theme,
    updatedAt: new Date().toISOString(),
    ...summary,
  }
}

export function buildSessionTvState(
  workout: WorkoutTemplate,
  targets: OverloadTarget[],
  exerciseIndex: number,
  setIndex: number,
  recoveryScore: number,
  theme: ThemeId,
  options: SessionTvOptions = {},
): TvSessionState {
  const ex = workout.exercises[exerciseIndex]
  const nextEx = workout.exercises[exerciseIndex + 1]
  const target = targets.find((t) => t.exerciseId === ex?.id)
  const weight = target?.adjustedWeightKg ?? ex?.weightKg
  const completed = options.completedExerciseIds?.length ?? 0

  let targetLabel = ''
  if (ex) {
    if (ex.metric === 'reps') targetLabel = `${ex.target} reps`
    else if (ex.metric === 'time') targetLabel = `${ex.target}s`
    else targetLabel = `${ex.target}m`
  }

  const startedAt = options.sessionStartedAt ?? new Date().toISOString()
  const elapsedMs = Date.now() - new Date(startedAt).getTime()
  const cameraEnabled = options.cameraEnabled ?? false
  const garminConnected = getGarminConnected()
  const coachEnabled = options.coachEnabled ?? getCoachEnabled()
  const rest: TvRestState = options.rest ?? {
    active: false,
    endsAt: null,
    totalSeconds: 0,
  }

  const sensor = computeMockSensor({
    exerciseIndex,
    setIndex,
    recoveryScore,
    elapsedMs,
    cameraEnabled,
    garminConnected,
  })

  const phase = getPhaseInfo(workout)
  const progress = computeWorkoutProgress(
    setIndex + 1,
    phase.total,
    phase.label,
    completed,
    workout.exercises.length,
  )

  return {
    mode: 'session',
    theme,
    connected: true,
    workoutName: workout.name,
    exerciseIndex,
    exerciseName: ex?.name ?? '—',
    exerciseKind: ex?.kind,
    metric: ex?.metric,
    equipment: ex?.equipment,
    icon: ex?.icon,
    exerciseMedia: ex?.media,
    exerciseDescription: ex?.description,
    nextExerciseName: nextEx?.name,
    completedCount: completed,
    totalExercises: workout.exercises.length,
    setIndex,
    totalSets: phase.total,
    phaseLabel: phase.label,
    progressPercent: progress.percent,
    completedSlots: progress.completedSlots,
    totalSlots: progress.totalSlots,
    targetLabel,
    weightKg: weight && weight > 0 ? weight : undefined,
    recoveryScore: garminConnected ? recoveryScore : undefined,
    sensor,
    coachEnabled,
    rest,
    updatedAt: new Date().toISOString(),
  }
}
