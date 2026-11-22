package net.moonbaseone.solo.domain

import net.moonbaseone.solo.domain.model.EquipmentCategory
import net.moonbaseone.solo.domain.model.ExerciseKind
import net.moonbaseone.solo.domain.model.LockerItem
import net.moonbaseone.solo.domain.model.SetMetric
import net.moonbaseone.solo.domain.model.WorkoutExercise
import net.moonbaseone.solo.domain.model.WorkoutSource
import net.moonbaseone.solo.domain.model.WorkoutTemplate
import java.time.Instant
import java.util.UUID

fun newId(): String = UUID.randomUUID().toString()

fun emptyExercise(nowId: String = newId()): WorkoutExercise =
    WorkoutExercise(
        id = nowId,
        name = "",
        kind = ExerciseKind.strength,
        metric = SetMetric.reps,
        target = 10,
        weightKg = 0.0,
        restSeconds = 60,
        equipment = emptyList(),
    )

/** Rough duration estimate used by the editor (matches web heuristic order of magnitude). */
fun estimateWorkoutMinutes(workout: WorkoutTemplate): Int {
    val phases = effectiveSets(workout)
    val workSeconds =
        workout.exercises.sumOf { ex ->
            val per =
                when (ex.metric) {
                    SetMetric.reps -> (ex.target * 3).coerceAtLeast(15)
                    SetMetric.time -> ex.target
                    SetMetric.distance -> (ex.target / 2).coerceAtLeast(20)
                }
            per + ex.restSeconds
        }
    val between = (workout.restBetweenRounds ?: workout.restBetweenSets).coerceAtLeast(0)
    val total = (workSeconds * phases) + (between * (phases - 1).coerceAtLeast(0))
    return (total / 60).coerceAtLeast(1)
}

fun createWorkout(
    name: String,
    description: String?,
    exercises: List<WorkoutExercise>,
    sets: Int,
    restBetweenSets: Int,
    circuitRounds: Int? = null,
    restBetweenRounds: Int? = null,
    favorite: Boolean = false,
    tags: List<String> = emptyList(),
    now: Instant = Instant.now(),
): WorkoutTemplate {
    val iso = now.toString()
    val draft =
        WorkoutTemplate(
            id = newId(),
            name = name.trim(),
            description = description?.trim()?.ifBlank { null },
            exercises = exercises.filter { it.name.isNotBlank() }.ifEmpty { listOf(emptyExercise()) },
            sets = sets.coerceAtLeast(1),
            restBetweenSets = restBetweenSets.coerceAtLeast(0),
            circuitRounds = circuitRounds,
            restBetweenRounds = restBetweenRounds,
            favorite = favorite,
            source = WorkoutSource.manual,
            estimatedMinutes = 1,
            tags = tags,
            createdAt = iso,
            updatedAt = iso,
        )
    return draft.copy(estimatedMinutes = estimateWorkoutMinutes(draft))
}

fun updateWorkout(
    existing: WorkoutTemplate,
    name: String,
    description: String?,
    exercises: List<WorkoutExercise>,
    sets: Int,
    restBetweenSets: Int,
    circuitRounds: Int? = null,
    restBetweenRounds: Int? = null,
    favorite: Boolean = existing.favorite,
    tags: List<String> = existing.tags,
    now: Instant = Instant.now(),
): WorkoutTemplate {
    val draft =
        existing.copy(
            name = name.trim(),
            description = description?.trim()?.ifBlank { null },
            exercises = exercises.filter { it.name.isNotBlank() }.ifEmpty { listOf(emptyExercise()) },
            sets = sets.coerceAtLeast(1),
            restBetweenSets = restBetweenSets.coerceAtLeast(0),
            circuitRounds = circuitRounds,
            restBetweenRounds = restBetweenRounds,
            favorite = favorite,
            tags = tags,
            updatedAt = now.toString(),
        )
    return draft.copy(estimatedMinutes = estimateWorkoutMinutes(draft))
}

fun toggleFavorite(workout: WorkoutTemplate, now: Instant = Instant.now()): WorkoutTemplate =
    workout.copy(favorite = !workout.favorite, updatedAt = now.toString())

fun createLockerItem(
    name: String,
    brand: String = "",
    category: EquipmentCategory,
    weightKg: Double? = null,
    resistance: String? = null,
    notes: String? = null,
    now: Instant = Instant.now(),
): LockerItem {
    val iso = now.toString()
    return LockerItem(
        id = newId(),
        name = name.trim(),
        brand = brand.trim(),
        category = category,
        weightKg = weightKg,
        resistance = resistance?.trim()?.ifBlank { null },
        notes = notes?.trim()?.ifBlank { null },
        createdAt = iso,
        updatedAt = iso,
    )
}

fun updateLockerItem(
    existing: LockerItem,
    name: String,
    brand: String,
    category: EquipmentCategory,
    weightKg: Double?,
    resistance: String?,
    notes: String?,
    now: Instant = Instant.now(),
): LockerItem =
    existing.copy(
        name = name.trim(),
        brand = brand.trim(),
        category = category,
        weightKg = weightKg,
        resistance = resistance?.trim()?.ifBlank { null },
        notes = notes?.trim()?.ifBlank { null },
        updatedAt = now.toString(),
    )
