package net.moonbaseone.solo.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import net.moonbaseone.solo.domain.model.HistoryEntry
import net.moonbaseone.solo.domain.model.SoloSnapshot
import net.moonbaseone.solo.ui.components.SoftSurface

@Composable
fun SummaryScreen(
    snapshot: SoloSnapshot,
    entryId: String? = null,
    onDone: () -> Unit,
) {
    val entry =
        entryId?.let { id -> snapshot.history.find { it.id == id } }
            ?: snapshot.history.firstOrNull()
    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
                .testTag("screen_summary"),
    ) {
        Text("Summary", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(16.dp))
        if (entry == null) {
            Text("No completed session yet.")
        } else {
            SummaryBody(entry)
        }
        Spacer(Modifier.height(24.dp))
        Button(
            onClick = onDone,
            modifier = Modifier.fillMaxWidth().testTag("summary_done"),
        ) {
            Text("Done")
        }
    }
}

@Composable
fun SummaryBody(entry: HistoryEntry) {
    SoftSurface {
        Text(entry.workoutName, style = MaterialTheme.typography.titleLarge)
        Text(
            "${entry.totalDurationSeconds}s · ${entry.totalSets} sets · ${entry.totalExercisesCompleted} exercises",
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier.padding(top = 8.dp),
        )
        Text(
            "Finished ${entry.completedAt}",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(top = 4.dp),
        )
    }
    if (entry.setWallDurations.isNotEmpty()) {
        SoftSurface(modifier = Modifier.padding(top = 12.dp)) {
            Text("Set times", style = MaterialTheme.typography.titleMedium)
            entry.setWallDurations.toSortedMap().forEach { (set, seconds) ->
                Text("Set $set — ${seconds}s", style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
    if (entry.exercises.isNotEmpty()) {
        SoftSurface(modifier = Modifier.padding(top = 12.dp)) {
            Text("Exercises", style = MaterialTheme.typography.titleMedium)
            entry.exercises.forEach { line ->
                Text(line.name, style = MaterialTheme.typography.titleSmall, modifier = Modifier.padding(top = 8.dp))
                Text(
                    "${line.durationSeconds}s · ${line.trend}" +
                        if (line.trendPercent != 0) " (${line.trendPercent}%)" else "",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}
