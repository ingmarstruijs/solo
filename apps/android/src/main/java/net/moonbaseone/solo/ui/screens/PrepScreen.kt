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
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import net.moonbaseone.solo.domain.model.SoloSnapshot

@Composable
fun PrepScreen(
    snapshot: SoloSnapshot,
    onStart: () -> Unit,
    onBack: () -> Unit,
    onOpenPair: () -> Unit,
) {
    val prep = snapshot.prep
    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
                .testTag("screen_prep"),
    ) {
        Text("Prep", style = MaterialTheme.typography.headlineMedium)
        if (prep == null) {
            Text("No prep ready — pick workouts first.", modifier = Modifier.padding(top = 16.dp))
            OutlinedButton(onClick = onBack, modifier = Modifier.padding(top = 16.dp)) {
                Text("Back")
            }
            return
        }
        Text(
            "Recovery ${prep.recoveryScore.toInt()}%",
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier.padding(top = 8.dp, bottom = 16.dp),
        )
        prep.workouts.forEach { prepared ->
            Text(prepared.workout.name, style = MaterialTheme.typography.titleLarge)
            prepared.targets.forEach { target ->
                val name =
                    prepared.workout.exercises.find { it.id == target.exerciseId }?.name
                        ?: target.exerciseId
                val reason = target.reason?.let { " — $it" } ?: ""
                Text(
                    "$name → ${target.adjustedWeightKg} kg$reason",
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(vertical = 2.dp),
                )
            }
            Spacer(Modifier.height(12.dp))
        }
        OutlinedButton(
            onClick = onOpenPair,
            modifier =
                Modifier
                    .fillMaxWidth()
                    .testTag("prep_pair"),
        ) {
            Text("Pair TV (optional)")
        }
        Spacer(Modifier.height(8.dp))
        Button(
            onClick = onStart,
            modifier =
                Modifier
                    .fillMaxWidth()
                    .testTag("prep_start"),
        ) {
            Text("Start session")
        }
        OutlinedButton(
            onClick = onBack,
            modifier =
                Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
        ) {
            Text("Back")
        }
    }
}
