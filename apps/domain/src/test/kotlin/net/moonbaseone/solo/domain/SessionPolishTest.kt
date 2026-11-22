package net.moonbaseone.solo.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.Instant

class SessionPolishTest {
    private val now = Instant.parse("2026-11-22T15:00:00Z")

    @Test
    fun undoComplete_restoresExercise() {
        val prep =
            prepareSession(listOf(SeedData.workouts.first()), SeedData.locker, 100.0, now)!!
        var session = startExercises(activatePrep(prep, now)!!.session, now)
        val id = session.workout.exercises.first().id
        session = completeExercise(session, id, now)
        assertTrue(id in session.completedExerciseIds)
        session = undoCompleteExercise(session, id)
        assertFalse(id in session.completedExerciseIds)
    }

    @Test
    fun togglePause_addsAndRemoves() {
        val prep =
            prepareSession(listOf(SeedData.workouts.first()), SeedData.locker, 100.0, now)!!
        var session = startExercises(activatePrep(prep, now)!!.session, now)
        val id = session.workout.exercises.first().id
        session = toggleExercisePause(session, id, now)
        assertTrue(id in session.pausedExerciseIds)
        session = toggleExercisePause(session, id, now.plusSeconds(5))
        assertFalse(id in session.pausedExerciseIds)
    }

    @Test
    fun multiWorkoutQueue_leavesRemainder() {
        val prep =
            prepareSession(
                SeedData.workouts.take(2),
                SeedData.locker,
                90.0,
                now,
            )!!
        val activated = activatePrep(prep, now)!!
        assertEquals(1, activated.remainingQueue.size)
        assertEquals(SeedData.workouts[1].id, activated.remainingQueue.first().workout.id)
    }

    @Test
    fun finishSession_includesExerciseLines() {
        val prep =
            prepareSession(listOf(SeedData.workouts.first()), SeedData.locker, 100.0, now)!!
        var session = startExercises(activatePrep(prep, now)!!.session, now)
        val id = session.workout.exercises.first().id
        session = skipRest(completeExercise(session, id, now), now)
        val entry = finishSession(session, now.plusSeconds(120))
        assertEquals("Upper Push", entry.workoutName)
        assertTrue(entry.exercises.isNotEmpty())
    }
}
