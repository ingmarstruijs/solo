package net.moonbaseone.solo.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
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
fun HomeScreen(
    snapshot: SoloSnapshot,
    onOpenWorkouts: () -> Unit,
    onResumeSession: () -> Unit,
    onOpenPrep: () -> Unit,
) {
    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .padding(24.dp)
                .testTag("screen_home"),
        verticalArrangement = Arrangement.Top,
    ) {
        Text("SOLO.", style = MaterialTheme.typography.displayLarge, color = MaterialTheme.colorScheme.primary)
        Text(
            "Home training — on device",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(top = 8.dp, bottom = 24.dp),
        )
        SoftSurface {
            Text(
                "${snapshot.workouts.size} workouts · ${snapshot.locker.size} locker items",
                style = MaterialTheme.typography.titleMedium,
            )
            Text(
                "Recovery ${snapshot.recoveryScore.toInt()}% · theme ${snapshot.theme}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 4.dp),
            )
        }
        Spacer(Modifier.height(16.dp))
        if (snapshot.activeSession != null) {
            Button(
                onClick = onResumeSession,
                modifier = Modifier.fillMaxWidth().testTag("home_resume"),
            ) {
                Text("Resume ${snapshot.activeSession!!.workout.name}")
            }
            Spacer(Modifier.height(8.dp))
        }
        if (snapshot.prep != null && snapshot.activeSession == null) {
            OutlinedButton(
                onClick = onOpenPrep,
                modifier = Modifier.fillMaxWidth().testTag("home_prep"),
            ) {
                Text("Continue prep (${snapshot.prep!!.workouts.size})")
            }
            Spacer(Modifier.height(8.dp))
        }
        Button(
            onClick = onOpenWorkouts,
            modifier = Modifier.fillMaxWidth().testTag("home_workouts"),
        ) {
            Text("Start a workout")
        }
    }
}
