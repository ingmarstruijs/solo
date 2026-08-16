import type { LockerItem } from '@/types/locker'
import type { OverloadTarget, WorkoutExercise, WorkoutTemplate } from '@/types/workout'
import { findClosestWeight, findMaxWeight } from '@/lib/locker/equipmentCatalog'
import { isRecoveryCritical } from '@/lib/storage/recoveryStore'
import { i18n } from '@/i18n'
import { configurePlates } from './plateConfigurator'

const RECOVERY_REDUCTION_MIN = 0.05
const RECOVERY_REDUCTION_MAX = 0.10

/** Base TUT bump when the locker is already at max load. */
const TUT_BASE_SECONDS = 5
/** Extra TUT seconds per ~2.5 kg of unmet overload above the ceiling. */
const TUT_PER_STEP_SECONDS = 2
const TUT_STEP_KG = 2.5
const TUT_MAX_SECONDS = 12

function recoveryReductionPercent(score: number): number {
  if (score >= 50) return 0
  const severity = (50 - score) / 50
  return RECOVERY_REDUCTION_MIN + severity * (RECOVERY_REDUCTION_MAX - RECOVERY_REDUCTION_MIN)
}

/**
 * When prescribed load is at/above the heaviest home weight, progress via
 * time-under-tension instead of adding plates you do not own.
 */
export function computeTutBonusSeconds(desiredKg: number, maxKg: number): number {
  if (desiredKg < maxKg) return 0
  const unmet = Math.max(0, desiredKg - maxKg)
  const steps = Math.floor(unmet / TUT_STEP_KG)
  return Math.min(TUT_MAX_SECONDS, TUT_BASE_SECONDS + steps * TUT_PER_STEP_SECONDS)
}

export function planOverloadTargets(
  workout: WorkoutTemplate,
  lockerItems: LockerItem[],
  recoveryScore: number,
): OverloadTarget[] {
  const critical = isRecoveryCritical(recoveryScore)
  const reduction = recoveryReductionPercent(recoveryScore)

  return workout.exercises.map((ex) => {
    let adjusted = ex.weightKg
    let maxKg: number | null = null

    if (ex.weightKg > 0 && ex.equipment.length > 0) {
      const primary = ex.equipment[0]
      maxKg = findMaxWeight(lockerItems, primary)
      const closest = findClosestWeight(lockerItems, primary, ex.weightKg)
      if (closest != null) adjusted = closest
    }

    if (critical && adjusted > 0) {
      adjusted = Math.round(adjusted * (1 - reduction) * 2) / 2
    }

    const adjustmentPercent =
      ex.weightKg > 0 ? Math.round(((adjusted - ex.weightKg) / ex.weightKg) * 100) : 0

    // Ceiling TUT only when still training at the heaviest home load (not during recovery deload).
    const atWeightCeiling =
      !critical &&
      maxKg != null &&
      maxKg > 0 &&
      adjusted >= maxKg &&
      ex.weightKg >= maxKg

    const tutBonusSeconds = atWeightCeiling ? computeTutBonusSeconds(ex.weightKg, maxKg!) : 0
    const adjustedTarget =
      tutBonusSeconds > 0 && ex.metric === 'time' ? ex.target + tutBonusSeconds : undefined

    const reasons: string[] = []
    if (critical) {
      reasons.push(
        i18n.t('session:prepReasonRecovery', {
          score: recoveryScore,
          percent: Math.round(reduction * 100),
        }),
      )
    }
    if (adjusted !== ex.weightKg && !critical) {
      reasons.push(i18n.t('session:prepReasonLocker'))
    }
    if (tutBonusSeconds > 0) {
      reasons.push(i18n.t('session:prepReasonTut', { seconds: tutBonusSeconds }))
    }

    return {
      exerciseId: ex.id,
      originalWeightKg: ex.weightKg,
      adjustedWeightKg: adjusted,
      adjustmentPercent,
      reason: reasons.join(' · ') || undefined,
      plateConfig:
        adjusted > 0 ? configurePlates(adjusted, lockerItems, ex.equipment) : undefined,
      ...(atWeightCeiling ? { atWeightCeiling: true } : {}),
      ...(tutBonusSeconds > 0 ? { tutBonusSeconds } : {}),
      ...(adjustedTarget != null ? { adjustedTarget } : {}),
    }
  })
}

export function estimateExerciseMinutes(ex: WorkoutExercise, workoutSets: number): number {
  const workSeconds =
    ex.metric === 'time'
      ? ex.target * workoutSets
      : ex.metric === 'distance'
        ? workoutSets * Math.max(60, ex.target * 0.3)
        : workoutSets * ex.target * 3
  const intraRest = (ex.restAfterReps ?? 0) * Math.max(0, workoutSets - 1)
  const restSeconds = ex.restSeconds * Math.max(0, workoutSets - 1) + intraRest
  return Math.ceil((workSeconds + restSeconds) / 60)
}

export function recalcWorkoutDuration(
  exercises: WorkoutExercise[],
  workoutSets: number,
  circuitRounds = 1,
  restBetweenRounds = 0,
): number {
  const base = exercises.reduce((sum, ex) => sum + estimateExerciseMinutes(ex, workoutSets), 0)
  const rounds = Math.max(1, circuitRounds)
  const between = rounds > 1 ? (rounds - 1) * Math.ceil(restBetweenRounds / 60) : 0
  return base * rounds + between
}
