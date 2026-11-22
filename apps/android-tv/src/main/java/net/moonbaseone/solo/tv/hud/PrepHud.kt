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
fun PrepHud(message: TvMessage.Prep) {
    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .padding(48.dp)
                .testTag("hud_prep"),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.Start,
    ) {
        Text(
            text = "Prepare",
            style = MaterialTheme.typography.headlineLarge,
            color = TvHudColors.Accent,
        )
        message.recoveryScore?.let { score ->
            Text(
                text = "Recovery $score",
                style = MaterialTheme.typography.titleLarge,
                color = TvHudColors.Subtitle,
                modifier = Modifier.padding(top = 8.dp),
            )
        }
        message.workouts.forEach { workout ->
            Text(
                text = "${workout.name} · ${workout.exerciseCount} exercises",
                style = MaterialTheme.typography.displaySmall,
                color = TvHudColors.Title,
                modifier = Modifier.padding(top = 16.dp),
            )
        }
    }
}
