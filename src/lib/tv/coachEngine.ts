import type { ActiveSession, OverloadTarget, WorkoutExercise } from '@/types/workout'
import { equipmentSummary, metricLabel } from '@/components/workout/ExerciseIcon'
import { bpmToPercentMax } from '@/lib/ble/heartRateMath'
import { i18n } from '@/i18n'

export type TvSensorState = {
  cameraEnabled: boolean
  garminConnected: boolean
  /** True when a live BLE heart-rate monitor is streaming. */
  heartRateLive: boolean
  /** Latest BPM from BLE, when available. */
  heartRateBpm: number | null
  velocityDropPercent: number
  heartRatePercentMax: number
}

type SensorInput = {
  exerciseIndex: number
  setIndex: number
  recoveryScore: number
  elapsedMs: number
  cameraEnabled: boolean
  garminConnected: boolean
  /** Live BLE BPM — preferred over the mock HR path when present. */
  liveHeartRateBpm?: number | null
}

/**
 * Session/TV sensor strip values.
 * HR prefers a live BLE sample; velocity stays mock until Connect IQ lands.
 */
export function computeSessionSensor({
  exerciseIndex,
  setIndex,
  recoveryScore,
  elapsedMs,
  cameraEnabled,
  garminConnected,
  liveHeartRateBpm = null,
}: SensorInput): TvSensorState {
  if (!garminConnected) {
    return {
      cameraEnabled,
      garminConnected: false,
      heartRateLive: false,
      heartRateBpm: null,
      velocityDropPercent: 0,
      heartRatePercentMax: 0,
    }
  }

  const elapsedMin = elapsedMs / 60_000
  const fatigue = (100 - recoveryScore) * 0.35
  const velocityDropPercent = Math.min(
    100,
    Math.round(setIndex * 14 + exerciseIndex * 9 + fatigue + elapsedMin * 6),
  )

  const hasLiveHr = liveHeartRateBpm != null && liveHeartRateBpm > 0
  const heartRatePercentMax = hasLiveHr
    ? bpmToPercentMax(liveHeartRateBpm)
    : Math.min(
        100,
        Math.round(62 + setIndex * 9 + exerciseIndex * 4 + elapsedMin * 8 + fatigue * 0.2),
      )

  return {
    cameraEnabled,
    garminConnected: true,
    heartRateLive: hasLiveHr,
    heartRateBpm: hasLiveHr ? liveHeartRateBpm : null,
    velocityDropPercent,
    heartRatePercentMax,
  }
}

/** @deprecated Use {@link computeSessionSensor}. Kept for older imports. */
export const computeMockSensor = computeSessionSensor

function formatExerciseDetails(ex: WorkoutExercise, weightKg: number): string {
  const parts: string[] = []
  parts.push(metricLabel(ex.metric, ex.target))
  if (weightKg > 0) parts.push(i18n.t('session:completion.detailsWeight', { kg: weightKg }))
  const equipment = equipmentSummary(ex.equipment)
  if (equipment) parts.push(equipment)
  if (ex.restSeconds > 0) {
    parts.push(i18n.t('session:completion.detailsRest', { seconds: ex.restSeconds }))
  }
  return parts.join('. ')
}

/** Announces the next incomplete exercise in the session. */
export function buildCompletionAnnouncement(
  session: ActiveSession,
  _completedExerciseId?: string,
): string {
  const { workout, targets, completedExerciseIds } = session

  const nextIndex = workout.exercises.findIndex((ex) => !completedExerciseIds.includes(ex.id))
  if (nextIndex < 0) return ''

  const next = workout.exercises[nextIndex]
  const target = targets.find((t) => t.exerciseId === next.id)
  const weight = target?.adjustedWeightKg ?? next.weightKg
  const details = formatExerciseDetails(next, weight)

  return details
    ? i18n.t('session:completion.next', { name: next.name, details })
    : i18n.t('session:completion.nextShort', { name: next.name })
}

export function getExerciseWeight(
  ex: WorkoutExercise,
  targets: OverloadTarget[],
): number {
  const target = targets.find((t) => t.exerciseId === ex.id)
  return target?.adjustedWeightKg ?? ex.weightKg
}

export function buildPauseAnnouncement(): string {
  return i18n.t('session:completion.paused')
}

export function buildResumeAnnouncement(exerciseName: string): string {
  return i18n.t('session:completion.resumed', { name: exerciseName })
}

export function buildNextSetReadyAnnouncement(
  nextSetNumber: number,
  phaseLabel: string,
): string {
  const isRound =
    phaseLabel === 'Ronde' || phaseLabel === 'Round' || phaseLabel === i18n.t('common:round')
  return isRound
    ? i18n.t('session:completion.readyRound', { number: nextSetNumber })
    : i18n.t('session:completion.readySet', { number: nextSetNumber })
}

export function buildRestStartAnnouncement(
  seconds: number,
  kind: 'exercise' | 'phase' = 'exercise',
  phaseLabel?: string,
): string {
  if (kind === 'phase') {
    const isRound =
      phaseLabel === 'Ronde' || phaseLabel === 'Round' || phaseLabel === i18n.t('common:round')
    return isRound
      ? i18n.t('session:completion.roundRest', { seconds })
      : i18n.t('session:completion.setRest', { seconds })
  }
  return i18n.t('session:completion.rest', { seconds })
}

export function restCountdownWord(seconds: number): string {
  const key = `session:countdown.${seconds}`
  const translated = i18n.t(key)
  if (translated === key) return String(seconds)
  return translated
}

export function buildStrainAnnouncement(): string {
  return i18n.t('session:strainCoach')
}

export function formatExerciseTargetLine(
  ex: WorkoutExercise,
  weightKg: number,
  options?: { targetOverride?: number; tutBonusSeconds?: number },
): string {
  const target = options?.targetOverride ?? ex.target
  const parts = [metricLabel(ex.metric, target)]
  if (weightKg > 0) parts.push(`${weightKg} ${i18n.t('common:kg')}`)
  const equipment = equipmentSummary(ex.equipment)
  if (equipment) parts.push(equipment)
  if (options?.tutBonusSeconds && options.tutBonusSeconds > 0 && ex.metric === 'reps') {
    parts.push(i18n.t('session:tutTempo', { seconds: options.tutBonusSeconds }))
  }
  if (ex.restSeconds > 0) {
    parts.push(i18n.t('session:completion.detailsRestShort', { seconds: ex.restSeconds }))
  }
  return parts.join(' · ')
}
