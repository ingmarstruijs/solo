package net.moonbaseone.solo.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

@Composable
fun SoloTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    themeId: String = "midnight",
    content: @Composable () -> Unit,
) {
    val accent = accentForTheme(themeId)
    val colorScheme =
        if (darkTheme) {
            darkColorScheme(
                primary = accent.dark,
                onPrimary = SoloDarkBackground,
                primaryContainer = accent.containerDark,
                onPrimaryContainer = accent.dark,
                secondary = accent.dark.copy(alpha = 0.85f),
                onSecondary = SoloDarkBackground,
                tertiary = SoloInfo,
                background = SoloDarkBackground,
                onBackground = SoloDarkOnBackground,
                surface = SoloDarkSurface,
                onSurface = SoloDarkOnSurface,
                surfaceVariant = SoloDarkSurfaceVariant,
                onSurfaceVariant = SoloDarkOnSurfaceVariant,
                outline = SoloDarkOutline,
                outlineVariant = SoloDarkOutlineVariant,
                surfaceContainerLowest = SoloDarkSurfaceContainerLowest,
                surfaceContainerLow = SoloDarkSurfaceContainerLow,
                surfaceContainer = SoloDarkSurfaceContainer,
                surfaceContainerHigh = SoloDarkSurfaceContainerHigh,
                surfaceContainerHighest = SoloDarkSurfaceContainerHighest,
                error = SoloError,
                onError = Color.White,
            )
        } else {
            lightColorScheme(
                primary = accent.light,
                onPrimary = Color.White,
                primaryContainer = accent.containerLight,
                onPrimaryContainer = accent.light,
                secondary = accent.light.copy(alpha = 0.85f),
                onSecondary = Color.White,
                tertiary = SoloInfo,
                background = SoloLightBackground,
                onBackground = SoloLightOnBackground,
                surface = SoloLightSurface,
                onSurface = SoloLightOnSurface,
                surfaceVariant = SoloLightSurfaceVariant,
                onSurfaceVariant = SoloLightOnSurfaceVariant,
                outline = SoloLightOutline,
                outlineVariant = SoloLightOutlineVariant,
                surfaceContainerLowest = SoloLightSurfaceContainerLowest,
                surfaceContainerLow = SoloLightSurfaceContainerLow,
                surfaceContainer = SoloLightSurfaceContainer,
                surfaceContainerHigh = SoloLightSurfaceContainerHigh,
                surfaceContainerHighest = SoloLightSurfaceContainerHighest,
                error = SoloErrorLight,
                onError = Color.White,
            )
        }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window ?: return@SideEffect
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = !darkTheme
                isAppearanceLightNavigationBars = !darkTheme
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = SoloTypography,
        content = content,
    )
}
