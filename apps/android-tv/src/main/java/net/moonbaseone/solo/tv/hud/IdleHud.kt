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
fun IdleHud(message: TvMessage.Idle) {
    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .padding(48.dp)
                .testTag("hud_idle"),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = "SOLO.",
            style = MaterialTheme.typography.displayLarge,
            color = TvHudColors.Title,
        )
        Text(
            text = "Ready",
            style = MaterialTheme.typography.headlineMedium,
            color = TvHudColors.Subtitle,
            modifier = Modifier.padding(top = 12.dp),
        )
        Text(
            text = message.theme,
            style = MaterialTheme.typography.bodyLarge,
            color = TvHudColors.Muted,
            modifier = Modifier.padding(top = 8.dp),
        )
    }
}
