package net.moonbaseone.solo.ui.theme

import androidx.compose.ui.graphics.Color

// Inspired by modern Material 3 apps (neutral dark + warm paper light, accent as the
// only strong chroma). Original SOLO palette — not copied from third-party sources.

val SoloDarkBackground = Color(0xFF0A0A0A)
val SoloDarkSurface = Color(0xFF141414)
val SoloDarkSurfaceVariant = Color(0xFF1E1E1E)
val SoloDarkOnBackground = Color(0xFFE4E4E4)
val SoloDarkOnSurface = Color(0xFFCFCFCF)
val SoloDarkOnSurfaceVariant = Color(0xFFAFAFAF)
val SoloDarkOutline = Color(0xFF3A3A3A)
val SoloDarkOutlineVariant = Color(0xFF242424)
val SoloDarkSurfaceContainerLowest = Color(0xFF070707)
val SoloDarkSurfaceContainerLow = Color(0xFF101010)
val SoloDarkSurfaceContainer = Color(0xFF151515)
val SoloDarkSurfaceContainerHigh = Color(0xFF1A1A1A)
val SoloDarkSurfaceContainerHighest = Color(0xFF1F1F1F)

val SoloLightBackground = Color(0xFFF7F5F1)
val SoloLightSurface = Color(0xFFFDFCFA)
val SoloLightSurfaceVariant = Color(0xFFECE8E1)
val SoloLightOnBackground = Color(0xFF1F1D1A)
val SoloLightOnSurface = Color(0xFF44413B)
val SoloLightOnSurfaceVariant = Color(0xFF5E5A53)
val SoloLightOutline = Color(0xFF8D8880)
val SoloLightOutlineVariant = Color(0xFFDEDAD2)
val SoloLightSurfaceContainerLowest = Color(0xFFFFFEFC)
val SoloLightSurfaceContainerLow = Color(0xFFFAF8F5)
val SoloLightSurfaceContainer = Color(0xFFF5F2EE)
val SoloLightSurfaceContainerHigh = Color(0xFFF0EDE8)
val SoloLightSurfaceContainerHighest = Color(0xFFEAE6E0)

val SoloError = Color(0xFFE53935)
val SoloErrorLight = Color(0xFFD32F2F)
val SoloInfo = Color(0xFF64B5F6)

data class SoloAccent(
    val id: String,
    val label: String,
    val dark: Color,
    val light: Color,
    val containerDark: Color,
    val containerLight: Color,
)

/** Maps persisted `SoloSnapshot.theme` ids to accent swatches. */
val SoloAccents =
    listOf(
        SoloAccent(
            id = "midnight",
            label = "Mint",
            dark = Color(0xFF5EEAD4),
            light = Color(0xFF0F766E),
            containerDark = Color(0xFF00382F),
            containerLight = Color(0xFFCCFBF1),
        ),
        SoloAccent(
            id = "dawn",
            label = "Amber",
            dark = Color(0xFFFFB300),
            light = Color(0xFFB45309),
            containerDark = Color(0xFF332200),
            containerLight = Color(0xFFFFECB3),
        ),
        SoloAccent(
            id = "forest",
            label = "Forest",
            dark = Color(0xFF34D399),
            light = Color(0xFF047857),
            containerDark = Color(0xFF052E22),
            containerLight = Color(0xFFD1FAE8),
        ),
        SoloAccent(
            id = "ember",
            label = "Ember",
            dark = Color(0xFFFF7F50),
            light = Color(0xFFC2410C),
            containerDark = Color(0xFF3A1408),
            containerLight = Color(0xFFFFE0D3),
        ),
        SoloAccent(
            id = "slate",
            label = "Slate",
            dark = Color(0xFF94A3B8),
            light = Color(0xFF475569),
            containerDark = Color(0xFF151B24),
            containerLight = Color(0xFFE2E8F0),
        ),
    )

fun accentForTheme(themeId: String): SoloAccent =
    SoloAccents.find { it.id == themeId } ?: SoloAccents.first()
