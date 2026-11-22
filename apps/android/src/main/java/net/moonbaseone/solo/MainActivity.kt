package net.moonbaseone.solo

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import net.moonbaseone.solo.ble.AndroidBleHrClient
import net.moonbaseone.solo.ble.BleHrClient
import net.moonbaseone.solo.ble.BleHrState
import net.moonbaseone.solo.ble.FakeBleHrClient
import net.moonbaseone.solo.ble.liveBpm
import net.moonbaseone.solo.contracts.TV_SCHEMA_VERSION
import net.moonbaseone.solo.contracts.TvMessage
import net.moonbaseone.solo.transport.DEFAULT_TV_WS_PORT
import net.moonbaseone.solo.transport.OkHttpTvSocketClient
import net.moonbaseone.solo.transport.PairPayload
import net.moonbaseone.solo.transport.PairingState
import net.moonbaseone.solo.transport.PhoneDialSession
import net.moonbaseone.solo.ui.theme.SoloTheme
import java.time.Instant

class MainActivity : ComponentActivity() {
    private val dialClient = OkHttpTvSocketClient()
    private var dialSession: PhoneDialSession? = null

    private var hrClient: BleHrClient? = null
    private var hrUiState by mutableStateOf<BleHrState>(BleHrState.Idle)
    private var hrSource by mutableStateOf("off")

    private val blePermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { grants ->
            if (grants.values.all { it }) {
                startRealBle()
            } else {
                hrUiState = BleHrState.Error("Bluetooth permission denied")
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            SoloTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    SoloShell(
                        hrState = hrUiState,
                        hrSource = hrSource,
                        onStartFakeHr = { startFakeHr() },
                        onStartRealHr = { requestBleAndStart() },
                        onStopHr = { stopHr() },
                        onConnect = { host, port, code, onState ->
                            dialSession?.disconnect()
                            lateinit var session: PhoneDialSession
                            session =
                                PhoneDialSession(
                                    payload =
                                        PairPayload(
                                            host = host.trim(),
                                            port = port,
                                            nonce = code.trim().uppercase(),
                                            schemaVersion = TV_SCHEMA_VERSION,
                                        ),
                                    stateListener = { state ->
                                        runOnUiThread { onState(state) }
                                        if (state is PairingState.Paired) {
                                            try {
                                                session.send(
                                                    TvMessage.Idle(
                                                        theme = "midnight",
                                                        updatedAt = Instant.now().toString(),
                                                    ),
                                                )
                                            } catch (_: Exception) {
                                                // UI still shows paired; send is best-effort smoke.
                                            }
                                        }
                                    },
                                )
                            dialSession = session
                            session.connect(dialClient)
                        },
                        onDisconnect = {
                            dialSession?.disconnect()
                            dialSession = null
                        },
                    )
                }
            }
        }
    }

    private fun requestBleAndStart() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val needed =
                arrayOf(
                    Manifest.permission.BLUETOOTH_SCAN,
                    Manifest.permission.BLUETOOTH_CONNECT,
                )
            val missing =
                needed.filter {
                    ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
                }
            if (missing.isNotEmpty()) {
                blePermissionLauncher.launch(missing.toTypedArray())
                return
            }
        }
        startRealBle()
    }

    private fun startFakeHr() {
        stopHr()
        val fake = FakeBleHrClient(sampleIntervalMs = 1_000)
        hrClient = fake
        hrSource = "fake"
        fake.addStateListener { state -> runOnUiThread { hrUiState = state } }
        fake.start()
        fake.pushSample(96)
    }

    private fun startRealBle() {
        stopHr()
        val real = AndroidBleHrClient(this)
        hrClient = real
        hrSource = "ble"
        real.addStateListener { state -> runOnUiThread { hrUiState = state } }
        real.start()
    }

    private fun stopHr() {
        hrClient?.stop()
        (hrClient as? FakeBleHrClient)?.shutdown()
        hrClient = null
        hrSource = "off"
        hrUiState = BleHrState.Idle
    }

    override fun onDestroy() {
        dialSession?.disconnect()
        dialSession = null
        stopHr()
        super.onDestroy()
    }
}

@Composable
fun SoloShell(
    hrState: BleHrState = BleHrState.Idle,
    hrSource: String = "off",
    onStartFakeHr: () -> Unit = {},
    onStartRealHr: () -> Unit = {},
    onStopHr: () -> Unit = {},
    onConnect: (host: String, port: Int, code: String, onState: (PairingState) -> Unit) -> Unit =
        { _, _, _, _ -> },
    onDisconnect: () -> Unit = {},
) {
    var host by remember { mutableStateOf("") }
    var portText by remember { mutableStateOf(DEFAULT_TV_WS_PORT.toString()) }
    var code by remember { mutableStateOf("") }
    var status by remember { mutableStateOf("Idle — enter TV host + pair code") }

    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
        verticalArrangement = Arrangement.Top,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(32.dp))
        Text(
            text = "SOLO.",
            style = MaterialTheme.typography.displayMedium,
        )
        Text(
            text = "Pair to Android TV",
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier.padding(top = 8.dp),
        )
        Text(
            text = BuildConfig.FLAVOR + " · " + BuildConfig.VERSION_NAME,
            style = MaterialTheme.typography.labelMedium,
            modifier = Modifier.padding(top = 8.dp, bottom = 16.dp),
        )

        Text(
            text = "Heart rate",
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.fillMaxWidth(),
        )
        Text(
            text = hrLabel(hrState, hrSource),
            style = MaterialTheme.typography.bodyMedium,
            modifier =
                Modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp, bottom = 8.dp)
                    .testTag("hr_status")
                    .semantics { contentDescription = hrLabel(hrState, hrSource) },
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            OutlinedButton(
                onClick = onStartFakeHr,
                modifier =
                    Modifier
                        .weight(1f)
                        .testTag("hr_fake"),
            ) {
                Text("Fake HR")
            }
            OutlinedButton(
                onClick = onStartRealHr,
                modifier =
                    Modifier
                        .weight(1f)
                        .testTag("hr_scan"),
            ) {
                Text("Scan band")
            }
            OutlinedButton(
                onClick = onStopHr,
                modifier =
                    Modifier
                        .weight(1f)
                        .testTag("hr_stop"),
            ) {
                Text("Stop")
            }
        }

        Spacer(Modifier.height(24.dp))

        OutlinedTextField(
            value = host,
            onValueChange = { host = it },
            label = { Text("TV host (LAN IP)") },
            singleLine = true,
            modifier =
                Modifier
                    .fillMaxWidth()
                    .testTag("pair_host"),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
        )
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = portText,
            onValueChange = { portText = it.filter { ch -> ch.isDigit() }.take(5) },
            label = { Text("Port") },
            singleLine = true,
            modifier =
                Modifier
                    .fillMaxWidth()
                    .testTag("pair_port"),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
        )
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = code,
            onValueChange = { code = it.filter { ch -> ch.isLetterOrDigit() }.take(6).uppercase() },
            label = { Text("Pair code") },
            singleLine = true,
            modifier =
                Modifier
                    .fillMaxWidth()
                    .testTag("pair_code"),
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
                status = "Dialing…"
                onConnect(host, port, code) { state ->
                    status =
                        when (state) {
                            is PairingState.Idle -> "Idle"
                            is PairingState.Dialing -> "Dialing…"
                            is PairingState.Handshaking -> "Handshaking…"
                            is PairingState.Listening -> "Listening…"
                            is PairingState.Paired -> "Paired — sent idle smoke"
                            is PairingState.Failed -> "Failed: ${state.reason}"
                        }
                }
            },
            enabled = host.isNotBlank() && code.length == 6,
            modifier =
                Modifier
                    .fillMaxWidth()
                    .testTag("pair_connect"),
        ) {
            Text("Connect")
        }
        Button(
            onClick = {
                onDisconnect()
                status = "Disconnected"
            },
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
    }
}

private fun hrLabel(state: BleHrState, source: String): String {
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

@Preview(showBackground = true)
@Composable
private fun SoloShellPreview() {
    SoloTheme {
        SoloShell()
    }
}
