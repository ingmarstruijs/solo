package net.moonbaseone.solo.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import net.moonbaseone.solo.domain.model.SoloSnapshot

@Composable
fun SummaryScreen(
    snapshot: SoloSnapshot,
    onDone: () -> Unit,
) {
    val entry = snapshot.history.firstOrNull()
    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .padding(16.dp)
                .testTag("screen_summary"),
    ) {
        Text("Summary", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(16.dp))
        if (entry == null) {
            Text("No completed session yet.")
        } else {
            Text(entry.workoutName, style = MaterialTheme.typography.titleLarge)
            Text(
                "${entry.totalDurationSeconds}s · ${entry.totalSets} sets · ${entry.totalExercisesCompleted} exercises",
                style = MaterialTheme.typography.bodyLarge,
                modifier = Modifier.padding(top = 8.dp),
            )
            Text(
                "Finished ${entry.completedAt}",
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(top = 4.dp),
            )
        }
        Spacer(Modifier.height(24.dp))
        Button(
            onClick = onDone,
            modifier =
                Modifier
                    .fillMaxWidth()
                    .testTag("summary_done"),
        ) {
            Text("Done")
        }
    }
}
