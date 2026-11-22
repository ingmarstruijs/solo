package net.moonbaseone.solo.domain.model

import kotlinx.serialization.Serializable

@Serializable
enum class EquipmentCategory {
    dumbbell,
    kettlebell,
    medicine_ball,
    resistance_band,
    barbell,
    weight_plate,
    pull_up_bar,
    bench,
    rower,
    cable,
    foam_roller,
    jump_rope,
    bodyweight,
    other,
}

@Serializable
enum class SetMetric {
    reps,
    time,
    distance,
}

@Serializable
enum class ExerciseKind {
    strength,
    cardio,
    mobility,
}

@Serializable
enum class WorkoutSource {
    manual,
    wger,
    garmin_fit,
    imported,
}

@Serializable
data class WorkoutExercise(
    val id: String,
    val name: String,
    val kind: ExerciseKind = ExerciseKind.strength,
    val metric: SetMetric = SetMetric.reps,
    val target: Int,
    val weightKg: Double = 0.0,
    val restSeconds: Int = 60,
    val equipment: List<EquipmentCategory> = emptyList(),
    val description: String? = null,
    val notes: String? = null,
)

@Serializable
data class WorkoutTemplate(
    val id: String,
    val name: String,
    val description: String? = null,
    val exercises: List<WorkoutExercise>,
    val sets: Int = 1,
    val restBetweenSets: Int = 90,
    val circuitRounds: Int? = null,
    val restBetweenRounds: Int? = null,
    val favorite: Boolean = false,
    val source: WorkoutSource = WorkoutSource.manual,
    val estimatedMinutes: Int = 30,
    val tags: List<String> = emptyList(),
    val createdAt: String,
    val updatedAt: String,
)

@Serializable
data class LockerItem(
    val id: String,
    val name: String,
    val brand: String = "",
    val category: EquipmentCategory,
    val weightKg: Double? = null,
    val resistance: String? = null,
    val notes: String? = null,
    val createdAt: String,
    val updatedAt: String,
)

@Serializable
data class OverloadTarget(
    val exerciseId: String,
    val originalWeightKg: Double,
    val adjustedWeightKg: Double,
    val adjustmentPercent: Int = 0,
    val reason: String? = null,
    val atWeightCeiling: Boolean = false,
    val tutBonusSeconds: Int = 0,
    val adjustedTarget: Int? = null,
)

@Serializable
data class SessionExerciseNote(
    val audioNote: String? = null,
    val audioNoteText: String? = null,
)

/**
 * Live workout session. Persisted for process-death recovery
 * (see [net.moonbaseone.solo.domain.ProcessDeathPolicy]).
 */
@Serializable
data class ActiveSession(
    val workout: WorkoutTemplate,
    val targets: List<OverloadTarget>,
    val completedExerciseIds: List<String> = emptyList(),
    val exerciseNotes: Map<String, SessionExerciseNote> = emptyMap(),
    val currentSet: Int = 1,
    val startedAt: String,
    val currentExerciseStartedAt: String? = null,
    val currentSetStartedAt: String? = null,
    val exerciseDurations: Map<String, Int> = emptyMap(),
    val exerciseDurationsBySet: Map<Int, Map<String, Int>> = emptyMap(),
    val setWallDurations: Map<Int, Int> = emptyMap(),
    val lastExerciseDuration: Map<String, Int> = emptyMap(),
    val rpeBySet: Map<Int, Int> = emptyMap(),
    val exercisesStarted: Boolean = false,
    val pausedExerciseIds: List<String> = emptyList(),
    val recoveryScore: Double = 100.0,
    /** Rest countdown ends at ISO-8601 instant; null when not resting. */
    val restEndsAt: String? = null,
    val restTotalSeconds: Int = 0,
    val restAfterExerciseName: String? = null,
)

@Serializable
data class PreparedWorkout(
    val workout: WorkoutTemplate,
    val targets: List<OverloadTarget>,
)

@Serializable
data class SessionPrep(
    val workouts: List<PreparedWorkout>,
    val recoveryScore: Double,
    val createdAt: String,
)

@Serializable
data class HistoryExerciseLine(
    val name: String,
    val durationSeconds: Int,
    val durationsBySet: List<Int> = emptyList(),
    val trend: String = "stable",
    val trendPercent: Int = 0,
)

@Serializable
data class HistoryEntry(
    val id: String,
    val workoutName: String,
    val startedAt: String,
    val completedAt: String,
    val totalDurationSeconds: Int,
    val totalSets: Int,
    val totalExercisesCompleted: Int,
    val exercises: List<HistoryExerciseLine> = emptyList(),
    val setWallDurations: Map<Int, Int> = emptyMap(),
)

@Serializable
data class SoloSnapshot(
    val workouts: List<WorkoutTemplate> = emptyList(),
    val locker: List<LockerItem> = emptyList(),
    val history: List<HistoryEntry> = emptyList(),
    val activeSession: ActiveSession? = null,
    val prep: SessionPrep? = null,
    /** Remaining prepared workouts after the active one (multi-select queue). */
    val workoutQueue: List<PreparedWorkout> = emptyList(),
    val recoveryScore: Double = 100.0,
    val theme: String = "midnight",
    val coachEnabled: Boolean = true,
    val seeded: Boolean = false,
)

val SOLO_THEMES = listOf("midnight", "dawn", "forest", "ember", "slate")
