package net.moonbaseone.solo.domain

import net.moonbaseone.solo.domain.model.EquipmentCategory
import net.moonbaseone.solo.domain.model.SetMetric
import net.moonbaseone.solo.domain.model.WorkoutSource
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class CatalogMutationsTest {
    @Test
    fun createWorkout_estimatesMinutesAndDropsBlankExercises() {
        val workout =
            createWorkout(
                name = " Test ",
                description = "  ",
                exercises =
                    listOf(
                        emptyExercise().copy(name = "Squat", target = 8, restSeconds = 90),
                        emptyExercise().copy(name = "  "),
                    ),
                sets = 3,
                restBetweenSets = 60,
            )
        assertEquals("Test", workout.name)
        assertEquals(null, workout.description)
        assertEquals(1, workout.exercises.size)
        assertTrue(workout.estimatedMinutes >= 1)
        assertEquals(WorkoutSource.manual, workout.source)
    }

    @Test
    fun toggleFavorite_flipsFlag() {
        val w = SeedData.workouts.first()
        val toggled = toggleFavorite(w)
        assertEquals(!w.favorite, toggled.favorite)
    }

    @Test
    fun lockerItem_roundTripUpdate() {
        val created =
            createLockerItem(
                name = "DB 12",
                category = EquipmentCategory.dumbbell,
                weightKg = 12.0,
            )
        val updated =
            updateLockerItem(
                created,
                name = "Dumbbell 12 kg",
                brand = "Rogue",
                category = EquipmentCategory.dumbbell,
                weightKg = 12.5,
                resistance = null,
                notes = "home",
            )
        assertEquals("Dumbbell 12 kg", updated.name)
        assertEquals("Rogue", updated.brand)
        assertEquals(12.5, updated.weightKg!!, 0.01)
        assertEquals("home", updated.notes)
        assertEquals(created.id, updated.id)
    }

    @Test
    fun estimate_timeMetricUsesTargetSeconds() {
        val w =
            createWorkout(
                name = "Mobility",
                description = null,
                exercises =
                    listOf(
                        emptyExercise().copy(
                            name = "Hold",
                            metric = SetMetric.time,
                            target = 60,
                            restSeconds = 0,
                        ),
                    ),
                sets = 2,
                restBetweenSets = 0,
            )
        assertFalse(w.estimatedMinutes < 1)
    }
}
