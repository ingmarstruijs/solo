package net.moonbaseone.solo.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Product chrome: charcoal + mint accent (matches launcher #0B0F14), not default purple M3.
private val SoloDark =
    darkColorScheme(
        primary = Color(0xFF5EEAD4),
        onPrimary = Color(0xFF00382F),
        primaryContainer = Color(0xFF005248),
        onPrimaryContainer = Color(0xFF99F6E4),
        secondary = Color(0xFFA7C4C0),
        onSecondary = Color(0xFF0F2A27),
        background = Color(0xFF0B0F14),
        onBackground = Color(0xFFE6EDF3),
        surface = Color(0xFF121820),
        onSurface = Color(0xFFE6EDF3),
        surfaceVariant = Color(0xFF1C2430),
        onSurfaceVariant = Color(0xFFB6C2CE),
    )

private val SoloLight =
    lightColorScheme(
        primary = Color(0xFF0F766E),
        onPrimary = Color(0xFFFFFFFF),
        primaryContainer = Color(0xFFCCFBF1),
        onPrimaryContainer = Color(0xFF042F2E),
        secondary = Color(0xFF4A635F),
        onSecondary = Color(0xFFFFFFFF),
        background = Color(0xFFF4F7F8),
        onBackground = Color(0xFF101418),
        surface = Color(0xFFFFFFFF),
        onSurface = Color(0xFF101418),
        surfaceVariant = Color(0xFFE2E8EE),
        onSurfaceVariant = Color(0xFF3F4A55),
    )

@Composable
fun SoloTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) SoloDark else SoloLight,
        content = content,
    )
}
