package net.moonbaseone.solo.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import net.moonbaseone.solo.domain.model.SoloSnapshot

@Composable
fun LockerScreen(snapshot: SoloSnapshot) {
    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .padding(16.dp)
                .testTag("screen_locker"),
    ) {
        Text("Locker", style = MaterialTheme.typography.headlineMedium)
        Text(
            "Home equipment used for overload matching",
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.padding(bottom = 12.dp),
        )
        LazyColumn {
            items(snapshot.locker, key = { it.id }) { item ->
                val weight =
                    item.weightKg?.let { "${it.toInt()} kg" }
                        ?: item.resistance
                        ?: "—"
                Text(
                    "${item.name} · ${item.category.name} · $weight",
                    style = MaterialTheme.typography.bodyLarge,
                    modifier =
                        Modifier
                            .padding(vertical = 8.dp)
                            .testTag("locker_${item.id}"),
                )
            }
        }
    }
}
