package net.moonbaseone.solo.tv.hud

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import net.moonbaseone.solo.contracts.TvMessage

@Composable
fun TvHudScreen(
    message: TvMessage,
    modifier: Modifier = Modifier,
) {
    val mode = hudModeFor(message)
    Box(
        modifier =
            modifier
                .fillMaxSize()
                .background(TvHudColors.Background)
                .testTag("tv_hud_${mode.name.lowercase()}"),
    ) {
        when (mode) {
            HudMode.Idle -> IdleHud(message as TvMessage.Idle)
            HudMode.Prep -> PrepHud(message as TvMessage.Prep)
            HudMode.Setup -> SetupHud(message as TvMessage.Setup)
            HudMode.Session -> SessionHud(message as TvMessage.Session)
            HudMode.Rest -> RestHud(message as TvMessage.Session)
            HudMode.Summary -> SummaryHud(message as TvMessage.Summary)
        }
    }
}
