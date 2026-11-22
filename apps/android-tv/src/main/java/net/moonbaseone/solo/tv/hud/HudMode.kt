package net.moonbaseone.solo.tv.hud

import net.moonbaseone.solo.contracts.TvMessage

enum class HudMode {
    Idle,
    Prep,
    Setup,
    Session,
    Rest,
    Summary,
}

fun hudModeFor(message: TvMessage): HudMode =
    when (message) {
        is TvMessage.Idle -> HudMode.Idle
        is TvMessage.Prep -> HudMode.Prep
        is TvMessage.Setup -> HudMode.Setup
        is TvMessage.Session -> if (message.rest.active) HudMode.Rest else HudMode.Session
        is TvMessage.Summary -> HudMode.Summary
    }
