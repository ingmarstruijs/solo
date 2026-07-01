import type { ActiveSession, OverloadTarget, WorkoutExercise } from '@/types/workout'
import { equipmentSummary, metricLabel } from '@/components/workout/ExerciseIcon'

export type TvSensorState = {
  cameraEnabled: boolean
  garminConnected: boolean
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
}

/** Deterministic mock sensor values until Edge AI / wearables land. */
export function computeMockSensor({
  exerciseIndex,
  setIndex,
  recoveryScore,
  elapsedMs,
  cameraEnabled,
  garminConnected,
}: SensorInput): TvSensorState {
  if (!garminConnected) {
    return {
      cameraEnabled,
      garminConnected: false,
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
  const heartRatePercentMax = Math.min(
    100,
    Math.round(62 + setIndex * 9 + exerciseIndex * 4 + elapsedMin * 8 + fatigue * 0.2),
  )

  return {
    cameraEnabled,
    garminConnected: true,
    velocityDropPercent,
    heartRatePercentMax,
  }
}

function formatExerciseDetails(ex: WorkoutExercise, weightKg: number): string {
  const parts: string[] = []
  parts.push(metricLabel(ex.metric, ex.target))
  if (weightKg > 0) parts.push(`${weightKg} kilo`)
  const equipment = equipmentSummary(ex.equipment)
  if (equipment) parts.push(equipment)
  if (ex.restSeconds > 0) parts.push(`rust ${ex.restSeconds} seconden`)
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

  return details ? `Volgende: ${next.name}. ${details}.` : `Volgende: ${next.name}.`
}

export function getExerciseWeight(
  ex: WorkoutExercise,
  targets: OverloadTarget[],
): number {
  const target = targets.find((t) => t.exerciseId === ex.id)
  return target?.adjustedWeightKg ?? ex.weightKg
}

export function buildRestStartAnnouncement(
  seconds: number,
  kind: 'exercise' | 'phase' = 'exercise',
  phaseLabel?: string,
): string {
  if (kind === 'phase' && phaseLabel) {
    return `Rust tussen ${phaseLabel.toLowerCase()}s. ${seconds} seconden.`
  }
  return `Rust. ${seconds} seconden.`
}

const COUNTDOWN_WORDS: Record<number, string> = {
  5: 'vijf',
  4: 'vier',
  3: 'drie',
  2: 'twee',
  1: 'één',
}

export function restCountdownWord(seconds: number): string {
  return COUNTDOWN_WORDS[seconds] ?? String(seconds)
}

export function formatExerciseTargetLine(ex: WorkoutExercise, weightKg: number): string {
  const parts = [metricLabel(ex.metric, ex.target)]
  if (weightKg > 0) parts.push(`${weightKg} kg`)
  const equipment = equipmentSummary(ex.equipment)
  if (equipment) parts.push(equipment)
  if (ex.restSeconds > 0) parts.push(`rust ${ex.restSeconds}s`)
  return parts.join(' · ')
}
