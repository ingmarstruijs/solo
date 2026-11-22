package net.moonbaseone.solo.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import net.moonbaseone.solo.transport.DEFAULT_TV_WS_PORT
import net.moonbaseone.solo.transport.PairingState

@Composable
fun PairScreen(
    pairing: PairingState,
    onConnect: (host: String, port: Int, code: String) -> Unit,
    onDisconnect: () -> Unit,
    onBack: () -> Unit,
) {
    var host by remember { mutableStateOf("") }
    var portText by remember { mutableStateOf(DEFAULT_TV_WS_PORT.toString()) }
    var code by remember { mutableStateOf("") }
    val status =
        when (pairing) {
            is PairingState.Idle -> "Idle — enter TV host + pair code"
            is PairingState.Dialing -> "Dialing…"
            is PairingState.Handshaking -> "Handshaking…"
            is PairingState.Listening -> "Listening…"
            is PairingState.Paired -> "Paired"
            is PairingState.Failed -> "Failed: ${pairing.reason}"
        }

    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .padding(16.dp)
                .testTag("screen_pair"),
    ) {
        Text("Pair Android TV", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(16.dp))
        OutlinedTextField(
            value = host,
            onValueChange = { host = it },
            label = { Text("TV host (LAN IP)") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth().testTag("pair_host"),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
        )
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = portText,
            onValueChange = { portText = it.filter { ch -> ch.isDigit() }.take(5) },
            label = { Text("Port") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth().testTag("pair_port"),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
        )
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = code,
            onValueChange = { code = it.filter { ch -> ch.isLetterOrDigit() }.take(6).uppercase() },
            label = { Text("Pair code") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth().testTag("pair_code"),
            keyboardOptions =
                KeyboardOptions(
                    capitalization = KeyboardCapitalization.Characters,
                    keyboardType = KeyboardType.Ascii,
                ),
        )
        Spacer(Modifier.height(16.dp))
        Button(
            onClick = {
                val port = portText.toIntOrNull() ?: DEFAULT_TV_WS_PORT
                onConnect(host, port, code)
            },
            enabled = host.isNotBlank() && code.length == 6,
            modifier = Modifier.fillMaxWidth().testTag("pair_connect"),
        ) {
            Text("Connect")
        }
        Button(
            onClick = onDisconnect,
            modifier =
                Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp)
                    .testTag("pair_disconnect"),
        ) {
            Text("Disconnect")
        }
        Text(
            text = status,
            style = MaterialTheme.typography.bodyMedium,
            modifier =
                Modifier
                    .padding(top = 24.dp)
                    .testTag("pair_status")
                    .semantics { contentDescription = status },
        )
        OutlinedButton(
            onClick = onBack,
            modifier = Modifier.fillMaxWidth().padding(top = 24.dp),
        ) {
            Text("Back")
        }
    }
}
