package net.moonbaseone.solo.tv.hud

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
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

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun SummaryHud(message: TvMessage.Summary) {
    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .padding(48.dp)
                .testTag("hud_summary"),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.Start,
    ) {
        Text(
            text = "Summary",
            style = MaterialTheme.typography.headlineLarge,
            color = TvHudColors.Accent,
        )
        Text(
            text = message.workoutName,
            style = MaterialTheme.typography.displayMedium,
            color = TvHudColors.Title,
            modifier = Modifier.padding(top = 12.dp),
        )
        Text(
            text = "${message.stats.totalSets} sets · ${message.stats.totalExercisesCompleted} exercises",
            style = MaterialTheme.typography.titleLarge,
            color = TvHudColors.Subtitle,
            modifier = Modifier.padding(top = 8.dp),
        )
        Text(
            text = message.stats.paceLabel,
            style = MaterialTheme.typography.headlineSmall,
            color = TvHudColors.Title,
            modifier = Modifier.padding(top = 16.dp),
        )
        Text(
            text = formatDuration(message.totalDurationSeconds),
            style = MaterialTheme.typography.displaySmall,
            color = TvHudColors.Title,
            modifier = Modifier.padding(top = 8.dp),
        )
    }
}

private fun formatDuration(totalSeconds: Int): String {
    val m = totalSeconds / 60
    val s = totalSeconds % 60
    return "%d:%02d".format(m, s)
}
