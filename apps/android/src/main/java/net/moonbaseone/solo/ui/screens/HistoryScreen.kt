package net.moonbaseone.solo.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
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
fun HistoryScreen(
    snapshot: SoloSnapshot,
    onOpenSummary: () -> Unit,
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
                modifier = Modifier.padding(top = 16.dp),
            )
        } else {
            LazyColumn(modifier = Modifier.padding(top = 12.dp)) {
                items(snapshot.history, key = { it.id }) { entry ->
                    Column(
                        modifier =
                            Modifier
                                .fillMaxWidth()
                                .clickable(onClick = onOpenSummary)
                                .padding(vertical = 10.dp)
                                .testTag("history_${entry.id}"),
                    ) {
                        Text(entry.workoutName, style = MaterialTheme.typography.titleMedium)
                        Text(
                            "${entry.totalDurationSeconds / 60} min · ${entry.totalSets} sets · ${entry.completedAt}",
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                }
            }
        }
    }
}
