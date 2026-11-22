package net.moonbaseone.solo.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import net.moonbaseone.solo.domain.model.SoloSnapshot

@Composable
fun WorkoutsScreen(
    snapshot: SoloSnapshot,
    onPrepare: (List<String>) -> Unit,
    onCreate: () -> Unit,
    onEdit: (String) -> Unit,
    onToggleFavorite: (String) -> Unit,
) {
    val selected = remember { mutableStateMapOf<String, Boolean>() }

    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .padding(16.dp)
                .testTag("screen_workouts"),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("Workouts", style = MaterialTheme.typography.headlineMedium)
            OutlinedButton(onClick = onCreate, modifier = Modifier.testTag("workouts_new")) {
                Text("New")
            }
        }
        Text(
            "Select one or more, then prepare — or edit a template",
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.padding(bottom = 12.dp),
        )
        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            items(snapshot.workouts, key = { it.id }) { workout ->
                val checked = selected[workout.id] == true
                Row(
                    modifier =
                        Modifier
                            .fillMaxWidth()
                            .padding(vertical = 6.dp)
                            .testTag("workout_${workout.id}"),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Checkbox(
                        checked = checked,
                        onCheckedChange = { selected[workout.id] = it },
                    )
                    Text(
                        "${if (workout.favorite) "★ " else ""}${workout.name}\n" +
                            "${workout.exercises.size} exercises · ~${workout.estimatedMinutes} min",
                        style = MaterialTheme.typography.bodyLarge,
                        modifier =
                            Modifier
                                .weight(1f)
                                .clickable { onEdit(workout.id) }
                                .padding(start = 4.dp),
                    )
                    TextButton(
                        onClick = { onToggleFavorite(workout.id) },
                        modifier = Modifier.testTag("workout_fav_${workout.id}"),
                    ) {
                        Text(if (workout.favorite) "★" else "☆")
                    }
                }
            }
        }
        Button(
            onClick = {
                val ids = selected.filterValues { it }.keys.toList()
                if (ids.isNotEmpty()) onPrepare(ids)
            },
            enabled = selected.any { it.value },
            modifier =
                Modifier
                    .fillMaxWidth()
                    .testTag("workouts_prepare"),
        ) {
            Text("Prepare session")
        }
    }
}
