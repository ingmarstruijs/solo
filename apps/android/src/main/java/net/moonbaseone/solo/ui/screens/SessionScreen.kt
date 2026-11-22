package net.moonbaseone.solo.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
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
import androidx.compose.ui.Alignment
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
import net.moonbaseone.solo.ui.components.SoftSurface
import java.time.Instant

@Composable
fun SessionScreen(
    snapshot: SoloSnapshot,
    hrState: BleHrState,
    onBegin: () -> Unit,
    onComplete: (String) -> Unit,
    onUndo: (String) -> Unit,
    onTogglePause: (String) -> Unit,
    onSkipRest: () -> Unit,
    onFinish: () -> Unit,
    onCancel: () -> Unit,
    onOpenPair: () -> Unit,
    onAnnounce: (String) -> Unit = {},
) {
    val session = snapshot.activeSession
    if (session == null) {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Text("No active session")
            OutlinedButton(onClick = onCancel) { Text("Home") }
        }
        return
    }

    val resting = session.restEndsAt != null
    if (resting) {
        RestOverlay(
            endsAt = session.restEndsAt!!,
            afterName = session.restAfterExerciseName,
            nextLabel =
                currentExercise(session)?.let { "${it.name} · ${targetLabel(session, it.id)}" },
            onSkip = onSkipRest,
            onFinished = onSkipRest,
        )
        return
    }

    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
                .testTag("screen_session"),
    ) {
        Text(session.workout.name, style = MaterialTheme.typography.headlineMedium)
        val queueLeft = snapshot.workoutQueue.size
        SoftSurface(modifier = Modifier.padding(top = 12.dp, bottom = 16.dp)) {
            Text(
                "Set ${session.currentSet} / ${effectiveSets(session.workout)}" +
                    if (queueLeft > 0) " · +$queueLeft queued" else "",
                style = MaterialTheme.typography.titleMedium,
            )
            hrState.liveBpm?.let { bpm ->
                Text(
                    "HR $bpm bpm",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(top = 4.dp),
                )
            }
        }

        if (!session.exercisesStarted) {
            SoftSurface {
                Text("Setup — gather materials, then begin.", style = MaterialTheme.typography.bodyMedium)
                session.workout.exercises.forEach { ex ->
                    Text(
                        "• ${ex.name} · ${targetLabel(session, ex.id)}",
                        modifier = Modifier.padding(vertical = 2.dp),
                    )
                }
            }
            Spacer(Modifier.height(16.dp))
            OutlinedButton(
                onClick = onOpenPair,
                modifier = Modifier.fillMaxWidth().testTag("session_pair"),
            ) {
                Text("Pair TV")
            }
            Button(
                onClick = {
                    onBegin()
                    val first = session.workout.exercises.firstOrNull()
                    if (first != null) {
                        onAnnounce("Start: ${first.name}. ${targetLabel(session, first.id)}")
                    }
                },
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

        val current = currentExercise(session)
        val setDone = allExercisesDoneInSet(session)
        val last = isLastSet(session)

        // Sticky active block stays at top of the scroll content.
        SoftSurface(modifier = Modifier.padding(bottom = 16.dp).testTag("session_sticky")) {
            if (setDone && last) {
                Text(
                    if (queueLeft > 0) "Workout complete — next in queue" else "Workout complete",
                    style = MaterialTheme.typography.titleLarge,
                )
                Button(
                    onClick = {
                        onFinish()
                        if (queueLeft > 0) onAnnounce("Next workout ready.")
                        else onAnnounce("Workout finished.")
                    },
                    modifier =
                        Modifier
                            .fillMaxWidth()
                            .padding(top = 12.dp)
                            .testTag("session_finish"),
                ) {
                    Text(if (queueLeft > 0) "Next workout" else "Finish & summary")
                }
            } else if (current != null) {
                val paused = current.id in session.pausedExerciseIds
                Text("Now", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                Text(
                    current.name,
                    style = MaterialTheme.typography.displaySmall,
                    modifier = Modifier.testTag("session_active"),
                )
                Text(
                    targetLabel(session, current.id) + if (paused) " · paused" else "",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp, bottom = 12.dp),
                )
                Button(
                    onClick = {
                        onComplete(current.id)
                        onAnnounce("Done. Rest.")
                    },
                    enabled = !paused,
                    modifier = Modifier.fillMaxWidth().testTag("session_complete"),
                ) {
                    Text("Complete set")
                }
                Row(modifier = Modifier.fillMaxWidth().padding(top = 8.dp)) {
                    OutlinedButton(
                        onClick = { onTogglePause(current.id) },
                        modifier = Modifier.weight(1f).padding(end = 4.dp).testTag("session_pause"),
                    ) {
                        Text(if (paused) "Resume" else "Pause")
                    }
                    OutlinedButton(
                        onClick = { onUndo(current.id) },
                        enabled = false,
                        modifier = Modifier.weight(1f).padding(start = 4.dp),
                    ) {
                        Text("Undo")
                    }
                }
            }
        }

        Text("Exercises", style = MaterialTheme.typography.titleMedium)
        session.workout.exercises.forEach { ex ->
            val done = ex.id in session.completedExerciseIds
            val isCurrent = current?.id == ex.id
            SoftSurface(modifier = Modifier.padding(top = 8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        "${if (done) "✓" else if (isCurrent) "▶" else "○"} ${ex.name}",
                        style =
                            if (isCurrent) {
                                MaterialTheme.typography.titleMedium
                            } else {
                                MaterialTheme.typography.bodyMedium
                            },
                        color =
                            if (isCurrent) {
                                MaterialTheme.colorScheme.primary
                            } else {
                                MaterialTheme.colorScheme.onSurface
                            },
                        modifier = Modifier.weight(1f),
                    )
                    if (done) {
                        OutlinedButton(
                            onClick = { onUndo(ex.id) },
                            modifier = Modifier.testTag("session_undo_${ex.id}"),
                        ) {
                            Text("Undo")
                        }
                    }
                }
            }
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
private fun RestOverlay(
    endsAt: String,
    afterName: String?,
    nextLabel: String?,
    onSkip: () -> Unit,
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
    Box(
        modifier =
            Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.primaryContainer)
                .testTag("session_rest_overlay"),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(24.dp),
        ) {
            Text("Rest", style = MaterialTheme.typography.headlineMedium)
            Text(
                "${remaining}s",
                style = MaterialTheme.typography.displayLarge,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(vertical = 16.dp).testTag("session_rest"),
            )
            afterName?.let {
                Text("After $it", style = MaterialTheme.typography.bodyLarge)
            }
            nextLabel?.let {
                Text("Next: $it", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(top = 8.dp))
            }
            Button(
                onClick = onSkip,
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .padding(top = 24.dp)
                        .testTag("session_skip_rest"),
            ) {
                Text("Skip rest")
            }
        }
    }
}
