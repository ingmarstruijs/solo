package net.moonbaseone.solo.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import net.moonbaseone.solo.ble.BleHrState
import net.moonbaseone.solo.ble.liveBpm
import net.moonbaseone.solo.domain.model.SoloSnapshot
import net.moonbaseone.solo.transport.PairingState

@Composable
fun SettingsScreen(
    snapshot: SoloSnapshot,
    hrState: BleHrState,
    hrSource: String,
    pairing: PairingState,
    onRecovery: (Double) -> Unit,
    onOpenPair: () -> Unit,
    onStartFakeHr: () -> Unit,
    onStartRealHr: () -> Unit,
    onStopHr: () -> Unit,
) {
    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .padding(16.dp)
                .testTag("screen_settings"),
    ) {
        Text("Settings", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(16.dp))
        Text("Recovery ${snapshot.recoveryScore.toInt()}%", style = MaterialTheme.typography.titleMedium)
        Slider(
            value = snapshot.recoveryScore.toFloat(),
            onValueChange = { onRecovery(it.toDouble()) },
            valueRange = 0f..100f,
            modifier = Modifier.testTag("settings_recovery"),
        )
        Spacer(Modifier.height(16.dp))
        Text("Android TV", style = MaterialTheme.typography.titleMedium)
        Text(
            pairingLabel(pairing),
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.padding(vertical = 4.dp),
        )
        Button(
            onClick = onOpenPair,
            modifier =
                Modifier
                    .fillMaxWidth()
                    .testTag("settings_pair"),
        ) {
            Text("Pair TV")
        }
        Spacer(Modifier.height(16.dp))
        Text("Heart rate", style = MaterialTheme.typography.titleMedium)
        Text(
            hrLabel(hrState, hrSource),
            style = MaterialTheme.typography.bodyMedium,
            modifier =
                Modifier
                    .padding(vertical = 4.dp)
                    .testTag("hr_status"),
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
            OutlinedButton(onClick = onStartFakeHr, modifier = Modifier.weight(1f).testTag("hr_fake")) {
                Text("Fake")
            }
            OutlinedButton(onClick = onStartRealHr, modifier = Modifier.weight(1f).testTag("hr_scan")) {
                Text("Scan")
            }
            OutlinedButton(onClick = onStopHr, modifier = Modifier.weight(1f).testTag("hr_stop")) {
                Text("Stop")
            }
        }
        Spacer(Modifier.height(24.dp))
        Text(
            "foss · process-death restores active session",
            style = MaterialTheme.typography.labelMedium,
        )
    }
}

private fun pairingLabel(state: PairingState): String =
    when (state) {
        is PairingState.Idle -> "Not paired"
        is PairingState.Dialing -> "Dialing…"
        is PairingState.Handshaking -> "Handshaking…"
        is PairingState.Listening -> "Listening…"
        is PairingState.Paired -> "Paired"
        is PairingState.Failed -> "Failed: ${state.reason}"
    }

private fun hrLabel(
    state: BleHrState,
    source: String,
): String {
    val bpm = state.liveBpm
    return when (state) {
        is BleHrState.Idle -> "HR off"
        is BleHrState.Unsupported -> "Bluetooth unavailable"
        is BleHrState.Scanning -> "Scanning… ($source)"
        is BleHrState.Connecting -> "Connecting ${state.deviceName ?: ""} ($source)"
        is BleHrState.Connected ->
            if (bpm != null) {
                "${state.deviceName}: $bpm bpm ($source)"
            } else {
                "${state.deviceName}: connected ($source)"
            }
        is BleHrState.Disconnected -> "Disconnected: ${state.reason ?: "—"}"
        is BleHrState.Error -> "HR error: ${state.message}"
    }
}
