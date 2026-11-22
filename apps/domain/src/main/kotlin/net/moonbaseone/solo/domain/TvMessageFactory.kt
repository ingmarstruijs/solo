package net.moonbaseone.solo.domain

import net.moonbaseone.solo.contracts.TV_SCHEMA_VERSION
import net.moonbaseone.solo.contracts.TvMessage
import net.moonbaseone.solo.contracts.TvPrepWorkout
import net.moonbaseone.solo.contracts.TvRestState
import net.moonbaseone.solo.contracts.TvSensorState
import net.moonbaseone.solo.contracts.TvSetupMaterial
import net.moonbaseone.solo.contracts.TvSummaryStats
import net.moonbaseone.solo.domain.model.ActiveSession
import net.moonbaseone.solo.domain.model.HistoryEntry
import net.moonbaseone.solo.domain.model.SessionPrep
import java.time.Instant

fun idleTvMessage(
    theme: String,
    now: Instant = Instant.now(),
): TvMessage.Idle =
    TvMessage.Idle(
        schemaVersion = TV_SCHEMA_VERSION,
        theme = theme,
        updatedAt = now.toString(),
    )

fun prepTvMessage(
    prep: SessionPrep,
    theme: String,
    now: Instant = Instant.now(),
): TvMessage.Prep =
    TvMessage.Prep(
        schemaVersion = TV_SCHEMA_VERSION,
        theme = theme,
        workouts =
            prep.workouts.map {
                TvPrepWorkout(
                    id = it.workout.id,
                    name = it.workout.name,
                    exerciseCount = it.workout.exercises.size,
                )
            },
        garminConnected = false,
        recoveryScore = prep.recoveryScore,
        updatedAt = now.toString(),
    )

fun setupTvMessage(
    session: ActiveSession,
    theme: String,
    now: Instant = Instant.now(),
): TvMessage.Setup {
    val materials =
        session.workout.exercises
            .flatMap { it.equipment }
            .distinct()
            .map { cat ->
                TvSetupMaterial(
                    id = cat.name,
                    category = cat.name,
                    label = cat.name.replace('_', ' '),
                )
            }
    return TvMessage.Setup(
        schemaVersion = TV_SCHEMA_VERSION,
        theme = theme,
        workoutName = session.workout.name,
        exerciseCount = session.workout.exercises.size,
        materials = materials,
        garminConnected = false,
        recoveryScore = session.recoveryScore,
        updatedAt = now.toString(),
    )
}

fun sessionTvMessage(
    session: ActiveSession,
    theme: String,
    heartRateBpm: Int? = null,
    now: Instant = Instant.now(),
): TvMessage.Session {
    val exercises = session.workout.exercises
    val current = currentExercise(session)
    val index = current?.let { exercises.indexOfFirst { e -> e.id == it.id } }?.coerceAtLeast(0) ?: 0
    val totalSets = effectiveSets(session.workout)
    val totalSlots = exercises.size * totalSets
    val completedSlots =
        ((session.currentSet - 1) * exercises.size) + session.completedExerciseIds.size
    val progress =
        if (totalSlots == 0) {
            0.0
        } else {
            (completedSlots.toDouble() / totalSlots) * 100.0
        }
    val resting = session.restEndsAt != null
    val next = current?.let { c ->
        exercises.dropWhile { it.id != c.id }.drop(1).firstOrNull()
    }

    return TvMessage.Session(
        schemaVersion = TV_SCHEMA_VERSION,
        theme = theme,
        connected = true,
        workoutName = session.workout.name,
        exerciseIndex = index,
        exerciseName = current?.name ?: session.workout.name,
        exerciseKind = current?.kind?.name,
        metric = current?.metric?.name,
        equipment = current?.equipment?.map { it.name },
        icon = current?.equipment?.firstOrNull()?.name,
        exerciseDescription = current?.description,
        nextExerciseName = next?.name,
        completedCount = session.completedExerciseIds.size,
        totalExercises = exercises.size,
        setIndex = session.currentSet,
        totalSets = totalSets,
        phaseLabel = if ((session.workout.circuitRounds ?: 0) > 1) "Round" else "Set",
        progressPercent = progress,
        completedSlots = completedSlots,
        totalSlots = totalSlots,
        targetLabel = current?.let { targetLabel(session, it.id) } ?: "—",
        weightKg = current?.let { targetFor(session, it.id)?.adjustedWeightKg ?: it.weightKg },
        recoveryScore = session.recoveryScore,
        sensor =
            TvSensorState(
                cameraEnabled = false,
                garminConnected = false,
                heartRateLive = heartRateBpm != null,
                heartRateBpm = heartRateBpm,
                velocityDropPercent = 0.0,
                heartRatePercentMax = 0.0,
            ),
        coachEnabled = false,
        rest =
            TvRestState(
                active = resting,
                endsAt = session.restEndsAt,
                totalSeconds = session.restTotalSeconds,
                afterExerciseName = session.restAfterExerciseName,
                kind = if (resting) "between" else null,
                nextExerciseName = if (resting) current?.name else null,
                nextExerciseTarget =
                    if (resting && current != null) targetLabel(session, current.id) else null,
            ),
        exerciseStartedAt = session.currentExerciseStartedAt,
        exerciseTimerActive = session.exercisesStarted && !resting && current != null,
        updatedAt = now.toString(),
    )
}

fun summaryTvMessage(
    entry: HistoryEntry,
    theme: String,
    now: Instant = Instant.now(),
): TvMessage.Summary =
    TvMessage.Summary(
        schemaVersion = TV_SCHEMA_VERSION,
        theme = theme,
        updatedAt = now.toString(),
        workoutName = entry.workoutName,
        exercises = emptyList(),
        sets = emptyList(),
        stats =
            TvSummaryStats(
                phaseLabel = "Set",
                totalSets = entry.totalSets,
                totalExercisesCompleted = entry.totalExercisesCompleted,
                avgSetDurationSeconds =
                    if (entry.totalSets > 0) {
                        entry.totalDurationSeconds.toDouble() / entry.totalSets
                    } else {
                        0.0
                    },
                avgExercisePerSetSeconds = 0.0,
                paceChangePercent = 0.0,
                paceLabel = "stable",
            ),
        rpeBySet = emptyMap(),
        totalDurationSeconds = entry.totalDurationSeconds,
        startedAt = entry.startedAt,
        completedAt = entry.completedAt,
    )
