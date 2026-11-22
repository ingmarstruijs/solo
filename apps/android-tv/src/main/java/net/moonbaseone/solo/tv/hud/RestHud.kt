package net.moonbaseone.solo.tv.hud

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
fun RestHud(message: TvMessage.Session) {
    val rest = message.rest
    Box(
        modifier =
            Modifier
                .fillMaxSize()
                .background(TvHudColors.RestOverlay)
                .testTag("hud_rest"),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.padding(48.dp),
        ) {
            Text(
                text = "Rest",
                style = MaterialTheme.typography.headlineLarge,
                color = TvHudColors.Accent,
            )
            Text(
                text = "${rest.totalSeconds}s",
                style = MaterialTheme.typography.displayLarge,
                color = TvHudColors.Title,
            )
            rest.afterExerciseName?.let { name ->
                Text(
                    text = "After $name",
                    style = MaterialTheme.typography.titleLarge,
                    color = TvHudColors.Subtitle,
                )
            }
            rest.nextExerciseName?.let { next ->
                Text(
                    text = "Up next: $next",
                    style = MaterialTheme.typography.headlineMedium,
                    color = TvHudColors.Title,
                    modifier = Modifier.padding(top = 16.dp),
                )
            }
            rest.nextExerciseTarget?.let { target ->
                Text(
                    text = target,
                    style = MaterialTheme.typography.titleMedium,
                    color = TvHudColors.Muted,
                )
            }
        }
    }
}
