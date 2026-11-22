package net.moonbaseone.solo.domain

import net.moonbaseone.solo.domain.model.ActiveSession
import net.moonbaseone.solo.domain.model.HistoryEntry
import net.moonbaseone.solo.domain.model.OverloadTarget
import net.moonbaseone.solo.domain.model.PreparedWorkout
import net.moonbaseone.solo.domain.model.SessionPrep
import net.moonbaseone.solo.domain.model.SetMetric
import net.moonbaseone.solo.domain.model.WorkoutTemplate
import java.time.Instant
import java.util.UUID

fun prepareSession(
    workouts: List<WorkoutTemplate>,
    lockerItems: List<net.moonbaseone.solo.domain.model.LockerItem>,
    recoveryScore: Double,
    now: Instant = Instant.now(),
): SessionPrep? {
    if (workouts.isEmpty()) return null
    return SessionPrep(
        workouts =
            workouts.map { workout ->
                PreparedWorkout(
                    workout = workout,
                    targets = planOverloadTargets(workout, lockerItems, recoveryScore),
                )
            },
        recoveryScore = recoveryScore,
        createdAt = now.toString(),
    )
}

fun activatePrep(
    prep: SessionPrep,
    now: Instant = Instant.now(),
): ActiveSession? {
    val first = prep.workouts.firstOrNull() ?: return null
    val iso = now.toString()
    return ActiveSession(
        workout = first.workout,
        targets = first.targets,
        completedExerciseIds = emptyList(),
        currentSet = 1,
        startedAt = iso,
        currentSetStartedAt = iso,
        exercisesStarted = false,
        recoveryScore = prep.recoveryScore,
    )
}

fun startExercises(
    session: ActiveSession,
    now: Instant = Instant.now(),
): ActiveSession {
    if (session.exercisesStarted) return session
    val iso = now.toString()
    return session.copy(
        exercisesStarted = true,
        currentExerciseStartedAt = iso,
        pausedExerciseIds = emptyList(),
        restEndsAt = null,
        restTotalSeconds = 0,
        restAfterExerciseName = null,
    )
}

fun currentExercise(session: ActiveSession) =
    session.workout.exercises.firstOrNull { it.id !in session.completedExerciseIds }

fun targetFor(
    session: ActiveSession,
    exerciseId: String,
): OverloadTarget? = session.targets.find { it.exerciseId == exerciseId }

fun allExercisesDoneInSet(session: ActiveSession): Boolean =
    session.workout.exercises.isNotEmpty() &&
        session.completedExerciseIds.containsAll(session.workout.exercises.map { it.id })

fun isLastSet(session: ActiveSession): Boolean {
    val total = effectiveSets(session.workout)
    return session.currentSet >= total
}

fun effectiveSets(workout: WorkoutTemplate): Int {
    val rounds = workout.circuitRounds
    return if (rounds != null && rounds > 1) rounds else workout.sets.coerceAtLeast(1)
}

fun completeExercise(
    session: ActiveSession,
    exerciseId: String,
    now: Instant = Instant.now(),
    skipDuration: Boolean = false,
): ActiveSession {
    if (!session.exercisesStarted) return session
    if (exerciseId in session.completedExerciseIds) return session

    val exercise = session.workout.exercises.find { it.id == exerciseId } ?: return session
    val tracksTime = exercise.metric != SetMetric.reps && !skipDuration
    val exerciseDurations = session.exerciseDurations.toMutableMap()
    val lastExerciseDuration = session.lastExerciseDuration.toMutableMap()
    val bySet = session.exerciseDurationsBySet.toMutableMap()
    val setMap = (bySet[session.currentSet] ?: emptyMap()).toMutableMap()

    if (tracksTime) {
        val startedMs =
            Instant.parse(session.currentExerciseStartedAt ?: session.startedAt).toEpochMilli()
        val duration = ((now.toEpochMilli() - startedMs) / 1000).toInt().coerceAtLeast(1)
        lastExerciseDuration[exerciseId] = duration
        exerciseDurations[exerciseId] = (exerciseDurations[exerciseId] ?: 0) + duration
        setMap[exerciseId] = duration
    }
    bySet[session.currentSet] = setMap

    val completed = session.completedExerciseIds + exerciseId
    val next = session.workout.exercises.firstOrNull { it.id !in completed }
    val restSeconds =
        when {
            next != null -> exercise.restSeconds
            !isLastSet(session.copy(completedExerciseIds = completed)) ->
                session.workout.restBetweenRounds
                    ?: session.workout.restBetweenSets
            else -> 0
        }

    var patched =
        session.copy(
            completedExerciseIds = completed,
            exerciseDurations = exerciseDurations,
            exerciseDurationsBySet = bySet,
            lastExerciseDuration = lastExerciseDuration,
            currentExerciseStartedAt = now.toString(),
        )

    if (restSeconds > 0) {
        patched =
            patched.copy(
                restEndsAt = now.plusSeconds(restSeconds.toLong()).toString(),
                restTotalSeconds = restSeconds,
                restAfterExerciseName = exercise.name,
            )
    } else {
        patched =
            patched.copy(
                restEndsAt = null,
                restTotalSeconds = 0,
                restAfterExerciseName = null,
            )
    }
    return patched
}

fun clearExpiredRest(
    session: ActiveSession,
    now: Instant = Instant.now(),
): ActiveSession {
    val ends = session.restEndsAt ?: return session
    return if (Instant.parse(ends).isBefore(now) || Instant.parse(ends) == now) {
        session.copy(
            restEndsAt = null,
            restTotalSeconds = 0,
            restAfterExerciseName = null,
            currentExerciseStartedAt = now.toString(),
        )
    } else {
        session
    }
}

fun skipRest(
    session: ActiveSession,
    now: Instant = Instant.now(),
): ActiveSession =
    session.copy(
        restEndsAt = null,
        restTotalSeconds = 0,
        restAfterExerciseName = null,
        currentExerciseStartedAt = now.toString(),
    )

fun advanceToNextSet(
    session: ActiveSession,
    now: Instant = Instant.now(),
): ActiveSession {
    val start = Instant.parse(session.currentSetStartedAt ?: session.startedAt)
    val wall = ((now.toEpochMilli() - start.toEpochMilli()) / 1000).toInt().coerceAtLeast(1)
    val walls = session.setWallDurations + (session.currentSet to wall)
    val iso = now.toString()
    return session.copy(
        setWallDurations = walls,
        currentSet = session.currentSet + 1,
        completedExerciseIds = emptyList(),
        currentExerciseStartedAt = iso,
        currentSetStartedAt = iso,
        lastExerciseDuration = emptyMap(),
        restEndsAt = null,
        restTotalSeconds = 0,
        restAfterExerciseName = null,
    )
}

fun finishSession(
    session: ActiveSession,
    now: Instant = Instant.now(),
): HistoryEntry {
    val start = Instant.parse(session.startedAt)
    val duration = ((now.toEpochMilli() - start.toEpochMilli()) / 1000).toInt().coerceAtLeast(1)
    val completedSlots =
        session.exerciseDurationsBySet.values.sumOf { it.size } +
            if (session.completedExerciseIds.isNotEmpty() &&
                session.currentSet !in session.exerciseDurationsBySet
            ) {
                session.completedExerciseIds.size
            } else {
                0
            }
    return HistoryEntry(
        id = UUID.randomUUID().toString(),
        workoutName = session.workout.name,
        startedAt = session.startedAt,
        completedAt = now.toString(),
        totalDurationSeconds = duration,
        totalSets = session.currentSet,
        totalExercisesCompleted =
            completedSlots.coerceAtLeast(session.completedExerciseIds.size),
    )
}

fun restoreSessionAfterDeath(
    session: ActiveSession,
    now: Instant = Instant.now(),
): ActiveSession = clearExpiredRest(session, now)

fun targetLabel(
    session: ActiveSession,
    exerciseId: String,
): String {
    val ex = session.workout.exercises.find { it.id == exerciseId } ?: return "—"
    val target = targetFor(session, exerciseId)
    val repsOrTime = target?.adjustedTarget ?: ex.target
    val weight = target?.adjustedWeightKg ?: ex.weightKg
    val metricPart =
        when (ex.metric) {
            SetMetric.reps -> "$repsOrTime reps"
            SetMetric.time -> "${repsOrTime}s"
            SetMetric.distance -> "${repsOrTime}m"
        }
    return if (weight > 0) "$metricPart · ${formatKg(weight)} kg" else metricPart
}

fun formatKg(kg: Double): String =
    if (kg == kg.toLong().toDouble()) kg.toLong().toString() else kg.toString()
