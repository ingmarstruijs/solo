package net.moonbaseone.solo.ble

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.Context
import android.os.ParcelUuid
import java.util.UUID
import java.util.concurrent.CopyOnWriteArraySet
import java.util.concurrent.atomic.AtomicReference

/**
 * Native BLE Heart Rate (0x180D) client. Requires BLUETOOTH_SCAN / CONNECT
 * (API 31+) or legacy BLUETOOTH + location permissions on older devices.
 */
class AndroidBleHrClient(
    context: Context,
) : BleHrClient {
    private val appContext = context.applicationContext
    private val stateRef = AtomicReference<BleHrState>(BleHrState.Idle)
    private val stateListeners = CopyOnWriteArraySet<BleHrStateListener>()
    private val sampleListeners = CopyOnWriteArraySet<BleHrSampleListener>()

    private val bluetoothManager =
        appContext.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
    private val adapter: BluetoothAdapter? get() = bluetoothManager?.adapter

    private var gatt: BluetoothGatt? = null
    private var scanning = false

    override val state: BleHrState get() = stateRef.get()

    override fun addStateListener(listener: BleHrStateListener) {
        stateListeners += listener
        listener.onState(state)
    }

    override fun removeStateListener(listener: BleHrStateListener) {
        stateListeners -= listener
    }

    override fun addSampleListener(listener: BleHrSampleListener) {
        sampleListeners += listener
    }

    override fun removeSampleListener(listener: BleHrSampleListener) {
        sampleListeners -= listener
    }

    @SuppressLint("MissingPermission")
    override fun start() {
        val bt = adapter
        if (bt == null || !bt.isEnabled) {
            setState(BleHrState.Unsupported)
            return
        }
        stopScan()
        closeGatt()
        setState(BleHrState.Scanning)
        val scanner = bt.bluetoothLeScanner
        if (scanner == null) {
            setState(BleHrState.Error("BLE scanner unavailable"))
            return
        }
        scanning = true
        val filter =
            ScanFilter.Builder()
                .setServiceUuid(ParcelUuid(UUID.fromString(BleHrUuids.SERVICE)))
                .build()
        val settings =
            ScanSettings.Builder()
                .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
                .build()
        scanner.startScan(listOf(filter), settings, scanCallback)
    }

    @SuppressLint("MissingPermission")
    override fun stop() {
        stopScan()
        closeGatt()
        setState(BleHrState.Idle)
    }

    @SuppressLint("MissingPermission")
    private fun stopScan() {
        if (!scanning) return
        scanning = false
        try {
            adapter?.bluetoothLeScanner?.stopScan(scanCallback)
        } catch (_: Exception) {
            // Adapter may already be off.
        }
    }

    @SuppressLint("MissingPermission")
    private fun closeGatt() {
        try {
            gatt?.close()
        } catch (_: Exception) {
            // ignore
        }
        gatt = null
    }

    private val scanCallback =
        object : ScanCallback() {
            @SuppressLint("MissingPermission")
            override fun onScanResult(callbackType: Int, result: ScanResult) {
                stopScan()
                val device = result.device
                val name = device.name ?: result.scanRecord?.deviceName ?: "HR band"
                setState(BleHrState.Connecting(name))
                gatt = device.connectGatt(appContext, false, gattCallback)
            }

            override fun onScanFailed(errorCode: Int) {
                scanning = false
                setState(BleHrState.Error("scan failed ($errorCode)"))
            }
        }

    private val gattCallback =
        object : BluetoothGattCallback() {
            @SuppressLint("MissingPermission")
            override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
                if (newState == BluetoothProfile.STATE_CONNECTED) {
                    gatt.discoverServices()
                } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                    setState(BleHrState.Disconnected("GATT disconnected"))
                    closeGatt()
                }
            }

            @SuppressLint("MissingPermission")
            override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
                if (status != BluetoothGatt.GATT_SUCCESS) {
                    setState(BleHrState.Error("service discovery failed"))
                    return
                }
                val service = gatt.getService(UUID.fromString(BleHrUuids.SERVICE))
                val measurement =
                    service?.getCharacteristic(UUID.fromString(BleHrUuids.MEASUREMENT))
                if (measurement == null) {
                    setState(BleHrState.Error("no Heart Rate Measurement characteristic"))
                    return
                }
                val name = gatt.device.name ?: "HR band"
                setState(BleHrState.Connected(deviceName = name))
                gatt.setCharacteristicNotification(measurement, true)
                val cccd =
                    measurement.getDescriptor(
                        UUID.fromString(BleHrUuids.CLIENT_CHARACTERISTIC_CONFIG),
                    )
                if (cccd != null) {
                    cccd.value = BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
                    gatt.writeDescriptor(cccd)
                }
            }

            @Deprecated("Deprecated in Java")
            override fun onCharacteristicChanged(
                gatt: BluetoothGatt,
                characteristic: BluetoothGattCharacteristic,
            ) {
                if (characteristic.uuid != UUID.fromString(BleHrUuids.MEASUREMENT)) return
                val value = characteristic.value ?: return
                handleMeasurement(value)
            }

            override fun onCharacteristicChanged(
                gatt: BluetoothGatt,
                characteristic: BluetoothGattCharacteristic,
                value: ByteArray,
            ) {
                if (characteristic.uuid != UUID.fromString(BleHrUuids.MEASUREMENT)) return
                handleMeasurement(value)
            }
        }

    private fun handleMeasurement(value: ByteArray) {
        val bpm =
            try {
                parseHeartRateMeasurement(value)
            } catch (_: Exception) {
                return
            }
        val sample = HeartRateSample(bpm = bpm, timestampMillis = System.currentTimeMillis())
        val current = stateRef.get()
        if (current is BleHrState.Connected) {
            setState(current.copy(bpm = bpm, sampleAtMillis = sample.timestampMillis))
        }
        sampleListeners.forEach { it.onSample(sample) }
    }

    private fun setState(next: BleHrState) {
        stateRef.set(next)
        stateListeners.forEach { it.onState(next) }
    }
}
