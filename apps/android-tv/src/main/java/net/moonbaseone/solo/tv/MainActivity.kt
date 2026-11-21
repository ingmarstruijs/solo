package net.moonbaseone.solo.tv

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text
import net.moonbaseone.solo.tv.ui.theme.SoloTvTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SoloTvTheme {
                SoloTvShell()
            }
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun SoloTvShell() {
    Box(
        modifier =
            Modifier
                .fillMaxSize()
                .background(Color(0xFF0B0F14)),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.padding(48.dp),
        ) {
            Text(
                text = "SOLO.",
                style = MaterialTheme.typography.displayMedium,
                color = Color(0xFFE8EEF5),
            )
            Text(
                text = "Android TV companion shell",
                style = MaterialTheme.typography.titleMedium,
                color = Color(0xFF9AA7B5),
            )
            Text(
                text = BuildConfig.FLAVOR + " · " + BuildConfig.VERSION_NAME,
                style = MaterialTheme.typography.bodyMedium,
                color = Color(0xFF6B7785),
            )
        }
    }
}
