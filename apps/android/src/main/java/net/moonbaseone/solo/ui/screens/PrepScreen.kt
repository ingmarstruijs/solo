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
import net.moonbaseone.solo.ui.components.SoftSurface

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
        SoftSurface(modifier = Modifier.padding(top = 12.dp, bottom = 16.dp)) {
            Text(
                "Recovery ${prep.recoveryScore.toInt()}%",
                style = MaterialTheme.typography.titleMedium,
            )
            Text(
                "${prep.workouts.size} workout(s) queued · first starts now",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 4.dp),
            )
        }
        prep.workouts.forEachIndexed { index, prepared ->
            SoftSurface(modifier = Modifier.padding(bottom = 12.dp)) {
                Text(
                    if (index == 0) "1. ${prepared.workout.name} (first)"
                    else "${index + 1}. ${prepared.workout.name}",
                    style = MaterialTheme.typography.titleLarge,
                )
                Text(
                    "${prepared.workout.exercises.size} exercises · ~${prepared.workout.estimatedMinutes} min",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp, bottom = 8.dp),
                )
                Text("Target insights", style = MaterialTheme.typography.titleMedium)
                prepared.targets.forEach { target ->
                    val ex = prepared.workout.exercises.find { it.id == target.exerciseId }
                    val name = ex?.name ?: target.exerciseId
                    val tut =
                        if (target.tutBonusSeconds > 0) " · +${target.tutBonusSeconds}s TUT" else ""
                    val ceiling = if (target.atWeightCeiling) " · at locker ceiling" else ""
                    Text(
                        "$name → ${target.adjustedWeightKg} kg" +
                            (if (target.adjustmentPercent != 0) " (${target.adjustmentPercent}%)" else "") +
                            tut + ceiling,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(vertical = 2.dp),
                    )
                    target.reason?.let {
                        Text(
                            it,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(bottom = 4.dp),
                        )
                    }
                }
            }
        }
        OutlinedButton(
            onClick = onOpenPair,
            modifier = Modifier.fillMaxWidth().testTag("prep_pair"),
        ) {
            Text("Pair TV (optional)")
        }
        Spacer(Modifier.height(8.dp))
        Button(
            onClick = onStart,
            modifier = Modifier.fillMaxWidth().testTag("prep_start"),
        ) {
            Text(if (prep.workouts.size > 1) "Start first workout" else "Start session")
        }
        OutlinedButton(
            onClick = onBack,
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
        ) {
            Text("Back")
        }
    }
}
