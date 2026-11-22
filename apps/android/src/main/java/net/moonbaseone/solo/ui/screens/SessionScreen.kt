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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import net.moonbaseone.solo.ble.BleHrState
import net.moonbaseone.solo.ble.liveBpm
import net.moonbaseone.solo.domain.allExercisesDoneInSet
import net.moonbaseone.solo.domain.currentExercise
import net.moonbaseone.solo.domain.effectiveSets
import net.moonbaseone.solo.domain.isLastSet
import net.moonbaseone.solo.domain.targetLabel
import net.moonbaseone.solo.domain.model.SoloSnapshot
import java.time.Instant

@Composable
fun SessionScreen(
    snapshot: SoloSnapshot,
    hrState: BleHrState,
    onBegin: () -> Unit,
    onComplete: (String) -> Unit,
    onSkipRest: () -> Unit,
    onFinish: () -> Unit,
    onCancel: () -> Unit,
    onOpenPair: () -> Unit,
) {
    val session = snapshot.activeSession
    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
                .testTag("screen_session"),
    ) {
        if (session == null) {
            Text("No active session")
            OutlinedButton(onClick = onCancel) { Text("Home") }
            return
        }

        Text(session.workout.name, style = MaterialTheme.typography.headlineMedium)
        Text(
            "Set ${session.currentSet} / ${effectiveSets(session.workout)}",
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier.padding(top = 4.dp),
        )
        hrState.liveBpm?.let { bpm ->
            Text("HR $bpm bpm", style = MaterialTheme.typography.labelLarge)
        }

        Spacer(Modifier.height(16.dp))

        if (!session.exercisesStarted) {
            Text("Setup — gather materials, then begin.", style = MaterialTheme.typography.bodyMedium)
            session.workout.exercises.forEach { ex ->
                Text(
                    "• ${ex.name} · ${targetLabel(session, ex.id)}",
                    modifier = Modifier.padding(vertical = 2.dp),
                )
            }
            Spacer(Modifier.height(16.dp))
            OutlinedButton(
                onClick = onOpenPair,
                modifier = Modifier.fillMaxWidth().testTag("session_pair"),
            ) {
                Text("Pair TV")
            }
            Button(
                onClick = onBegin,
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp)
                        .testTag("session_begin"),
            ) {
                Text("Begin exercises")
            }
            OutlinedButton(
                onClick = onCancel,
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp).testTag("session_cancel"),
            ) {
                Text("Cancel")
            }
            return
        }

        val resting = session.restEndsAt != null
        if (resting) {
            RestCountdown(endsAt = session.restEndsAt!!, onFinished = onSkipRest)
            Text(
                "After ${session.restAfterExerciseName ?: "set"}",
                style = MaterialTheme.typography.bodyMedium,
            )
            Button(
                onClick = onSkipRest,
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .padding(top = 12.dp)
                        .testTag("session_skip_rest"),
            ) {
                Text("Skip rest")
            }
        }

        val current = currentExercise(session)
        val setDone = allExercisesDoneInSet(session)
        val last = isLastSet(session)

        if (setDone && last && !resting) {
            Text("Workout complete", style = MaterialTheme.typography.titleLarge)
            Button(
                onClick = onFinish,
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .padding(top = 12.dp)
                        .testTag("session_finish"),
            ) {
                Text("Finish & summary")
            }
        } else if (current != null && !resting) {
            Text(current.name, style = MaterialTheme.typography.titleLarge)
            Text(
                targetLabel(session, current.id),
                style = MaterialTheme.typography.bodyLarge,
                modifier = Modifier.padding(top = 4.dp, bottom = 12.dp),
            )
            Button(
                onClick = { onComplete(current.id) },
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .testTag("session_complete"),
            ) {
                Text("Complete set")
            }
        }

        Spacer(Modifier.height(24.dp))
        Text("Exercises", style = MaterialTheme.typography.titleMedium)
        session.workout.exercises.forEach { ex ->
            val done = ex.id in session.completedExerciseIds
            Text(
                "${if (done) "✓" else "○"} ${ex.name}",
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(vertical = 2.dp),
            )
        }
        OutlinedButton(
            onClick = onCancel,
            modifier =
                Modifier
                    .fillMaxWidth()
                    .padding(top = 24.dp)
                    .testTag("session_cancel"),
        ) {
            Text("Cancel session")
        }
    }
}

@Composable
private fun RestCountdown(
    endsAt: String,
    onFinished: () -> Unit,
) {
    var remaining by remember { mutableLongStateOf(0L) }
    LaunchedEffect(endsAt) {
        while (true) {
            val end = Instant.parse(endsAt).toEpochMilli()
            remaining = ((end - Instant.now().toEpochMilli()) / 1000).coerceAtLeast(0)
            if (remaining <= 0) {
                onFinished()
                break
            }
            delay(250)
        }
    }
    Text(
        "Rest ${remaining}s",
        style = MaterialTheme.typography.displaySmall,
        modifier = Modifier.testTag("session_rest"),
    )
}
