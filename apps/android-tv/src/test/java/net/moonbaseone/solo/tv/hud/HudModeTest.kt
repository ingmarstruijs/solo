package net.moonbaseone.solo.tv.hud

import net.moonbaseone.solo.contracts.TvMessage
import net.moonbaseone.solo.contracts.TvMessageCodec
import net.moonbaseone.solo.contracts.TvRestState
import net.moonbaseone.solo.contracts.TvSensorState
import org.junit.Assert.assertEquals
import org.junit.Test

class HudModeTest {
    @Test
    fun idleGolden_mapsToIdle() {
        val raw =
            """
            {"schemaVersion":1,"mode":"idle","theme":"midnight","updatedAt":"2026-11-21T12:00:00.000Z"}
            """.trimIndent()
        assertEquals(HudMode.Idle, hudModeFor(TvMessageCodec.decode(raw)))
    }

    @Test
    fun sessionWithoutRest_isSession() {
        val session =
            TvMessage.Session(
                theme = "midnight",
                connected = true,
                workoutName = "Push A",
                exerciseIndex = 1,
                exerciseName = "Bench",
                completedCount = 0,
                totalExercises = 6,
                setIndex = 1,
                totalSets = 4,
                phaseLabel = "Main",
                progressPercent = 10.0,
                completedSlots = 1,
                totalSlots = 14,
                targetLabel = "8 reps",
                sensor =
                    TvSensorState(
                        cameraEnabled = false,
                        garminConnected = false,
                        heartRateLive = false,
                    ),
                coachEnabled = false,
                rest = TvRestState(active = false),
                updatedAt = "t",
            )
        assertEquals(HudMode.Session, hudModeFor(session))
    }

    @Test
    fun sessionWithActiveRest_isRest() {
        val session =
            TvMessage.Session(
                theme = "midnight",
                connected = true,
                workoutName = "Push A",
                exerciseIndex = 1,
                exerciseName = "Bench",
                completedCount = 1,
                totalExercises = 6,
                setIndex = 1,
                totalSets = 4,
                phaseLabel = "Main",
                progressPercent = 20.0,
                completedSlots = 2,
                totalSlots = 14,
                targetLabel = "8 reps",
                sensor =
                    TvSensorState(
                        cameraEnabled = false,
                        garminConnected = false,
                        heartRateLive = false,
                    ),
                coachEnabled = false,
                rest = TvRestState(active = true, totalSeconds = 90),
                updatedAt = "t",
            )
        assertEquals(HudMode.Rest, hudModeFor(session))
    }

    @Test
    fun prepSetupSummary_modes() {
        assertEquals(
            HudMode.Prep,
            hudModeFor(
                TvMessage.Prep(
                    theme = "midnight",
                    workouts = emptyList(),
                    garminConnected = false,
                    updatedAt = "t",
                ),
            ),
        )
        assertEquals(
            HudMode.Setup,
            hudModeFor(
                TvMessage.Setup(
                    theme = "midnight",
                    workoutName = "Push A",
                    exerciseCount = 6,
                    materials = emptyList(),
                    garminConnected = false,
                    updatedAt = "t",
                ),
            ),
        )
    }
}
