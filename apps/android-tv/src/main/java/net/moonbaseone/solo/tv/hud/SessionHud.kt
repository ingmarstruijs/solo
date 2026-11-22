package net.moonbaseone.solo.tv.hud

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text
import net.moonbaseone.solo.contracts.TvMessage
import kotlin.math.roundToInt

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun SessionHud(message: TvMessage.Session) {
    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .padding(48.dp)
                .testTag("hud_session"),
        verticalArrangement = Arrangement.SpaceBetween,
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(
                text = message.workoutName,
                style = MaterialTheme.typography.titleLarge,
                color = TvHudColors.Subtitle,
            )
            Text(
                text = message.phaseLabel,
                style = MaterialTheme.typography.titleLarge,
                color = TvHudColors.Accent,
            )
        }

        Column(horizontalAlignment = Alignment.Start) {
            Text(
                text = message.exerciseName,
                style = MaterialTheme.typography.displayLarge,
                color = TvHudColors.Title,
            )
            Text(
                text = message.targetLabel,
                style = MaterialTheme.typography.headlineMedium,
                color = TvHudColors.Subtitle,
                modifier = Modifier.padding(top = 12.dp),
            )
            message.nextExerciseName?.let { next ->
                Text(
                    text = "Next: $next",
                    style = MaterialTheme.typography.titleMedium,
                    color = TvHudColors.Muted,
                    modifier = Modifier.padding(top = 8.dp),
                )
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Bottom,
        ) {
            Text(
                text = "Set ${message.setIndex}/${message.totalSets}",
                style = MaterialTheme.typography.headlineSmall,
                color = TvHudColors.Title,
            )
            Text(
                text = "${message.progressPercent.roundToInt()}%",
                style = MaterialTheme.typography.headlineSmall,
                color = TvHudColors.Subtitle,
            )
            val bpm = message.sensor.heartRateBpm
            Text(
                text = if (message.sensor.heartRateLive && bpm != null) "$bpm bpm" else "HR —",
                style = MaterialTheme.typography.headlineSmall,
                color = if (message.sensor.heartRateLive) TvHudColors.Warn else TvHudColors.Muted,
                modifier = Modifier.testTag("hud_session_hr"),
            )
        }
    }
}
