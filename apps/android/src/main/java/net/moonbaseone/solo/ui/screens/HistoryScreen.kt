package net.moonbaseone.solo.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import net.moonbaseone.solo.domain.model.SoloSnapshot
import net.moonbaseone.solo.ui.components.SoftSurface

@Composable
fun HistoryScreen(
    snapshot: SoloSnapshot,
    onOpenSummary: (String) -> Unit,
    onDelete: (String) -> Unit,
) {
    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .padding(16.dp)
                .testTag("screen_history"),
    ) {
        Text("History", style = MaterialTheme.typography.headlineMedium)
        if (snapshot.history.isEmpty()) {
            Text(
                "Completed sessions appear here.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 16.dp),
            )
        } else {
            LazyColumn(
                modifier = Modifier.padding(top = 12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                items(snapshot.history, key = { it.id }) { entry ->
                    SoftSurface(
                        modifier =
                            Modifier
                                .clickable { onOpenSummary(entry.id) }
                                .testTag("history_${entry.id}"),
                    ) {
                        Text(entry.workoutName, style = MaterialTheme.typography.titleMedium)
                        Text(
                            "${entry.totalDurationSeconds / 60} min · ${entry.totalSets} sets · ${entry.exercises.size} exercises",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(top = 4.dp),
                        )
                        TextButton(onClick = { onDelete(entry.id) }) {
                            Text("Delete")
                        }
                    }
                }
            }
        }
    }
}
