package net.moonbaseone.solo.domain

import net.moonbaseone.solo.domain.model.LockerItem
import net.moonbaseone.solo.domain.model.OverloadTarget
import net.moonbaseone.solo.domain.model.SetMetric
import net.moonbaseone.solo.domain.model.WorkoutTemplate

private const val RECOVERY_REDUCTION_MIN = 0.05
private const val RECOVERY_REDUCTION_MAX = 0.10
private const val TUT_BASE_SECONDS = 5
private const val TUT_PER_STEP_SECONDS = 2
private const val TUT_STEP_KG = 2.5
private const val TUT_MAX_SECONDS = 12

fun isRecoveryCritical(score: Double): Boolean = score < 50.0

fun recoveryReductionPercent(score: Double): Double {
    if (score >= 50.0) return 0.0
    val severity = (50.0 - score) / 50.0
    return RECOVERY_REDUCTION_MIN + severity * (RECOVERY_REDUCTION_MAX - RECOVERY_REDUCTION_MIN)
}

fun computeTutBonusSeconds(
    desiredKg: Double,
    maxKg: Double,
): Int {
    if (desiredKg < maxKg) return 0
    val unmet = (desiredKg - maxKg).coerceAtLeast(0.0)
    val steps = kotlin.math.floor(unmet / TUT_STEP_KG).toInt()
    return (TUT_BASE_SECONDS + steps * TUT_PER_STEP_SECONDS).coerceAtMost(TUT_MAX_SECONDS)
}

fun planOverloadTargets(
    workout: WorkoutTemplate,
    lockerItems: List<LockerItem>,
    recoveryScore: Double,
    applyRecovery: Boolean = true,
): List<OverloadTarget> {
    val score = if (applyRecovery) recoveryScore else 100.0
    val critical = isRecoveryCritical(score)
    val reduction = recoveryReductionPercent(score)

    return workout.exercises.map { ex ->
        var adjusted = ex.weightKg
        var maxKg: Double? = null

        if (ex.weightKg > 0 && ex.equipment.isNotEmpty()) {
            val primary = ex.equipment.first()
            maxKg = findMaxWeight(lockerItems, primary)
            val closest = findClosestWeight(lockerItems, primary, ex.weightKg)
            if (closest != null) adjusted = closest
        }

        if (critical && adjusted > 0) {
            adjusted = kotlin.math.round(adjusted * (1 - reduction) * 2) / 2.0
        }

        val adjustmentPercent =
            if (ex.weightKg > 0) {
                kotlin.math.round(((adjusted - ex.weightKg) / ex.weightKg) * 100).toInt()
            } else {
                0
            }

        val supportsTut = ex.metric == SetMetric.reps || ex.metric == SetMetric.time
        val atWeightCeiling =
            supportsTut &&
                !critical &&
                maxKg != null &&
                maxKg > 0 &&
                adjusted >= maxKg &&
                ex.weightKg >= maxKg

        val tutBonusSeconds =
            if (atWeightCeiling) computeTutBonusSeconds(ex.weightKg, maxKg!!) else 0
        val adjustedTarget =
            if (tutBonusSeconds > 0 && ex.metric == SetMetric.time) {
                ex.target + tutBonusSeconds
            } else {
                null
            }

        val reasons = mutableListOf<String>()
        if (critical) {
            reasons += "Recovery ${score.toInt()}% → −${kotlin.math.round(reduction * 100).toInt()}%"
        }
        if (adjusted != ex.weightKg && !critical) {
            reasons += "Matched to locker"
        }
        if (tutBonusSeconds > 0) {
            reasons += "+${tutBonusSeconds}s TUT at weight ceiling"
        }

        OverloadTarget(
            exerciseId = ex.id,
            originalWeightKg = ex.weightKg,
            adjustedWeightKg = adjusted,
            adjustmentPercent = adjustmentPercent,
            reason = reasons.joinToString(" · ").ifBlank { null },
            atWeightCeiling = atWeightCeiling,
            tutBonusSeconds = tutBonusSeconds,
            adjustedTarget = adjustedTarget,
        )
    }
}
