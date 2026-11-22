package net.moonbaseone.solo

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import net.moonbaseone.solo.ble.AndroidBleHrClient
import net.moonbaseone.solo.ble.BleHrClient
import net.moonbaseone.solo.ble.BleHrState
import net.moonbaseone.solo.ble.FakeBleHrClient
import net.moonbaseone.solo.ui.SoloApp
import net.moonbaseone.solo.ui.theme.SoloTheme

class MainActivity : ComponentActivity() {
    private val viewModel: SoloViewModel by viewModels()

    private var hrClient: BleHrClient? = null

    private val blePermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { grants ->
            if (grants.values.all { it }) {
                startRealBle()
            } else {
                viewModel.setHrState(BleHrState.Error("Bluetooth permission denied"), "ble")
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            SoloTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    SoloApp(
                        viewModel = viewModel,
                        onStartFakeHr = { startFakeHr() },
                        onStartRealHr = { requestBleAndStart() },
                        onStopHr = { stopHr() },
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
        fake.addStateListener { state -> runOnUiThread { viewModel.setHrState(state, "fake") } }
        fake.start()
        fake.pushSample(96)
    }

    private fun startRealBle() {
        stopHr()
        val real = AndroidBleHrClient(this)
        hrClient = real
        real.addStateListener { state -> runOnUiThread { viewModel.setHrState(state, "ble") } }
        real.start()
    }

    private fun stopHr() {
        hrClient?.stop()
        (hrClient as? FakeBleHrClient)?.shutdown()
        hrClient = null
        viewModel.setHrState(BleHrState.Idle, "off")
    }

    override fun onDestroy() {
        stopHr()
        super.onDestroy()
    }
}
