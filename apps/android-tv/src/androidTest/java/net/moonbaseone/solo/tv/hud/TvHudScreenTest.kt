package net.moonbaseone.solo.tv.hud

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.test.ext.junit.runners.AndroidJUnit4
import net.moonbaseone.solo.contracts.TvMessage
import net.moonbaseone.solo.contracts.TvMessageCodec
import net.moonbaseone.solo.tv.ui.theme.SoloTvTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class TvHudScreenTest {
    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun idleHud_showsReady() {
        val idle =
            TvMessageCodec.decode(
                """{"schemaVersion":1,"mode":"idle","theme":"midnight","updatedAt":"2026-11-21T12:00:00.000Z"}""",
            )
        composeRule.setContent {
            SoloTvTheme { TvHudScreen(message = idle) }
        }
        composeRule.onNodeWithTag("hud_idle").assertIsDisplayed()
        composeRule.onNodeWithText("Ready").assertIsDisplayed()
        composeRule.onNodeWithText("SOLO.").assertIsDisplayed()
    }

    @Test
    fun restGolden_showsRestTag() {
        val rest =
            TvMessageCodec.decode(
                """
                {
                  "schemaVersion": 1,
                  "mode": "session",
                  "theme": "midnight",
                  "connected": true,
                  "workoutName": "Push A",
                  "exerciseIndex": 1,
                  "exerciseName": "Bench press",
                  "completedCount": 2,
                  "totalExercises": 6,
                  "setIndex": 2,
                  "totalSets": 4,
                  "phaseLabel": "Main",
                  "progressPercent": 40,
                  "completedSlots": 6,
                  "totalSlots": 14,
                  "targetLabel": "8 reps",
                  "sensor": {
                    "cameraEnabled": false,
                    "garminConnected": false,
                    "heartRateLive": false
                  },
                  "coachEnabled": true,
                  "rest": {
                    "active": true,
                    "totalSeconds": 90,
                    "afterExerciseName": "Bench press",
                    "kind": "exercise",
                    "nextExerciseName": "Bench press"
                  },
                  "updatedAt": "2026-11-21T12:05:30.000Z"
                }
                """.trimIndent(),
            ) as TvMessage.Session
        composeRule.setContent {
            SoloTvTheme { TvHudScreen(message = rest) }
        }
        composeRule.onNodeWithTag("hud_rest").assertIsDisplayed()
        composeRule.onNodeWithText("Rest").assertIsDisplayed()
        composeRule.onNodeWithText("90s").assertIsDisplayed()
    }
}
