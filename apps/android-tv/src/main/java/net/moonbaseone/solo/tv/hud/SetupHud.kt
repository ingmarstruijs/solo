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
fun SetupHud(message: TvMessage.Setup) {
    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .padding(48.dp)
                .testTag("hud_setup"),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.Start,
    ) {
        Text(
            text = "Setup",
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
            text = "${message.exerciseCount} exercises",
            style = MaterialTheme.typography.titleLarge,
            color = TvHudColors.Subtitle,
            modifier = Modifier.padding(top = 8.dp),
        )
        message.materials.forEach { material ->
            Text(
                text = "${material.category}: ${material.label}",
                style = MaterialTheme.typography.headlineSmall,
                color = TvHudColors.Title,
                modifier = Modifier.padding(top = 12.dp),
            )
        }
    }
}
