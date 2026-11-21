package net.moonbaseone.solo.tv

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text
import net.moonbaseone.solo.contracts.TV_SCHEMA_VERSION
import net.moonbaseone.solo.contracts.TvMessage
import net.moonbaseone.solo.contracts.mode
import net.moonbaseone.solo.transport.DEFAULT_TV_WS_PORT
import net.moonbaseone.solo.transport.JavaWebSocketTvServer
import net.moonbaseone.solo.transport.PairPayload
import net.moonbaseone.solo.transport.PairPayloadCodec
import net.moonbaseone.solo.transport.PairingState
import net.moonbaseone.solo.transport.TvListenSession
import net.moonbaseone.solo.transport.generatePairNonce
import net.moonbaseone.solo.tv.ui.theme.SoloTvTheme

class MainActivity : ComponentActivity() {
    private val nonce = generatePairNonce()
    private var server: JavaWebSocketTvServer? = null
    private var listenSession: TvListenSession? = null

    private var uiHost by mutableStateOf("…")
    private var uiStatus by mutableStateOf("Starting…")
    private var uiLastMode by mutableStateOf("—")
    private var uiPayloadJson by mutableStateOf("")

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val host = localIpv4Addresses().firstOrNull() ?: "0.0.0.0"
        uiHost = host
        val payload =
            PairPayload(
                host = host,
                port = DEFAULT_TV_WS_PORT,
                nonce = nonce,
                schemaVersion = TV_SCHEMA_VERSION,
            )
        uiPayloadJson = PairPayloadCodec.encode(payload)

        val tvServer = JavaWebSocketTvServer(DEFAULT_TV_WS_PORT)
        server = tvServer
        val session =
            TvListenSession(
                expectedNonce = nonce,
                stateListener = { state ->
                    runOnUiThread {
                        uiStatus =
                            when (state) {
                                is PairingState.Idle -> "Idle"
                                is PairingState.Listening -> "Listening on :$DEFAULT_TV_WS_PORT"
                                is PairingState.Handshaking -> "Handshaking…"
                                is PairingState.Dialing -> "Dialing…"
                                is PairingState.Paired -> "Paired"
                                is PairingState.Failed -> "Failed: ${state.reason}"
                            }
                    }
                },
                messageListener = { message: TvMessage ->
                    runOnUiThread { uiLastMode = message.mode }
                },
            )
        listenSession = session
        try {
            session.bind(tvServer)
            uiStatus = "Listening on :$DEFAULT_TV_WS_PORT"
        } catch (e: Exception) {
            uiStatus = "Bind failed: ${e.message}"
        }

        setContent {
            SoloTvTheme {
                SoloTvShell(
                    pairCode = nonce,
                    host = uiHost,
                    status = uiStatus,
                    lastMode = uiLastMode,
                    payloadJson = uiPayloadJson,
                )
            }
        }
    }

    override fun onDestroy() {
        listenSession?.let { session ->
            server?.let { session.stop(it) }
        }
        listenSession = null
        server = null
        super.onDestroy()
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun SoloTvShell(
    pairCode: String,
    host: String,
    status: String,
    lastMode: String,
    payloadJson: String,
) {
    Box(
        modifier =
            Modifier
                .fillMaxSize()
                .background(Color(0xFF0B0F14)),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.padding(48.dp),
        ) {
            Text(
                text = "SOLO.",
                style = MaterialTheme.typography.displayMedium,
                color = Color(0xFFE8EEF5),
            )
            Text(
                text = "Pair code",
                style = MaterialTheme.typography.titleMedium,
                color = Color(0xFF9AA7B5),
            )
            Text(
                text = pairCode,
                style = MaterialTheme.typography.displayLarge,
                color = Color(0xFFE8EEF5),
            )
            Text(
                text = "$host:$DEFAULT_TV_WS_PORT",
                style = MaterialTheme.typography.titleMedium,
                color = Color(0xFF9AA7B5),
            )
            Text(
                text = status,
                style = MaterialTheme.typography.bodyLarge,
                color = Color(0xFF6B7785),
            )
            Text(
                text = "Last message: $lastMode",
                style = MaterialTheme.typography.bodyMedium,
                color = Color(0xFF6B7785),
            )
            Text(
                text = BuildConfig.FLAVOR + " · " + BuildConfig.VERSION_NAME,
                style = MaterialTheme.typography.bodySmall,
                color = Color(0xFF4A5560),
            )
            Text(
                text = payloadJson,
                style = MaterialTheme.typography.bodySmall,
                color = Color(0xFF3A4450),
            )
        }
    }
}
