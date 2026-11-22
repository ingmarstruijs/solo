package net.moonbaseone.solo.domain

import net.moonbaseone.solo.domain.model.EquipmentCategory
import net.moonbaseone.solo.domain.model.LockerItem
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.Instant

class SessionControllerTest {
    private val now = Instant.parse("2026-11-22T12:00:00Z")

    @Test
    fun prepareAndActivate_startsSetupPhase() {
        val prep =
            prepareSession(
                workouts = listOf(SeedData.workouts.first()),
                lockerItems = SeedData.locker,
                recoveryScore = 80.0,
                now = now,
            )
        assertNotNull(prep)
        val session = activatePrep(prep!!, now)
        assertNotNull(session)
        assertFalse(session!!.exercisesStarted)
        assertEquals(1, session.currentSet)
        assertEquals("Upper Push", session.workout.name)
        assertTrue(session.targets.isNotEmpty())
    }

    @Test
    fun completeExercise_marksDoneAndMayStartRest() {
        val prep =
            prepareSession(
                listOf(SeedData.workouts.first()),
                SeedData.locker,
                100.0,
                now,
            )!!
        var session = startExercises(activatePrep(prep, now)!!, now)
        val firstId = session.workout.exercises.first().id
        session = completeExercise(session, firstId, now)
        assertTrue(firstId in session.completedExerciseIds)
        assertNotNull(session.restEndsAt)
        assertEquals(90, session.restTotalSeconds)
    }

    @Test
    fun advanceSet_resetsCompletedExercises() {
        val workout = SeedData.workouts.first()
        val prep = prepareSession(listOf(workout), SeedData.locker, 100.0, now)!!
        var session = startExercises(activatePrep(prep, now)!!, now)
        for (ex in workout.exercises) {
            session = skipRest(completeExercise(session, ex.id, now), now)
        }
        assertTrue(allExercisesDoneInSet(session))
        session = advanceToNextSet(session, now.plusSeconds(10))
        assertEquals(2, session.currentSet)
        assertTrue(session.completedExerciseIds.isEmpty())
    }

    @Test
    fun restoreAfterDeath_clearsExpiredRest() {
        val prep =
            prepareSession(listOf(SeedData.workouts.first()), SeedData.locker, 100.0, now)!!
        var session = startExercises(activatePrep(prep, now)!!, now)
        session =
            completeExercise(session, session.workout.exercises.first().id, now).copy(
                restEndsAt = now.plusSeconds(30).toString(),
            )
        val restored = restoreSessionAfterDeath(session, now.plusSeconds(60))
        assertNull(restored.restEndsAt)
    }

    @Test
    fun overload_matchesLockerDumbbell() {
        val workout = SeedData.workouts.first()
        val targets = planOverloadTargets(workout, SeedData.locker, 100.0)
        val bench = targets.find { it.exerciseId == "seed-ex-bench" }!!
        assertEquals(20.0, bench.adjustedWeightKg, 0.01)
    }

    @Test
    fun overload_recoveryReducesLoad() {
        val workout = SeedData.workouts.first()
        val items =
            listOf(
                LockerItem(
                    id = "x",
                    name = "DB 20",
                    category = EquipmentCategory.dumbbell,
                    weightKg = 20.0,
                    createdAt = now.toString(),
                    updatedAt = now.toString(),
                ),
            )
        val targets = planOverloadTargets(workout, items, 20.0)
        val bench = targets.find { it.exerciseId == "seed-ex-bench" }!!
        assertTrue(bench.adjustedWeightKg < 20.0)
    }

    @Test
    fun tvSessionMessage_progressTracksCompletedSlots() {
        val prep =
            prepareSession(listOf(SeedData.workouts.first()), SeedData.locker, 72.0, now)!!
        var session = startExercises(activatePrep(prep, now)!!, now)
        session = skipRest(completeExercise(session, session.workout.exercises.first().id, now), now)
        val msg = sessionTvMessage(session, "midnight", heartRateBpm = 120, now = now)
        assertEquals("Upper Push", msg.workoutName)
        assertEquals(1, msg.completedCount)
        assertEquals(3, msg.totalExercises)
        assertEquals(4, msg.totalSets)
        assertEquals(12, msg.totalSlots)
        assertEquals(1, msg.completedSlots)
        assertTrue(msg.sensor.heartRateLive)
        assertEquals(120, msg.sensor.heartRateBpm)
    }

    @Test
    fun snapshot_roundTripsJson() {
        val snap =
            net.moonbaseone.solo.domain.model.SoloSnapshot(
                workouts = SeedData.workouts,
                locker = SeedData.locker,
                seeded = true,
            )
        val encoded = DomainJson.encodeToString(
            net.moonbaseone.solo.domain.model.SoloSnapshot.serializer(),
            snap,
        )
        val decoded =
            DomainJson.decodeFromString(
                net.moonbaseone.solo.domain.model.SoloSnapshot.serializer(),
                encoded,
            )
        assertEquals(4, decoded.workouts.size)
        assertEquals(SeedData.locker.size, decoded.locker.size)
        assertTrue(decoded.seeded)
    }
}
