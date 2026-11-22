package net.moonbaseone.solo.ble

/**
 * Heart-rate band client. Real Android uses [BluetoothGatt]; tests use [FakeBleHrClient].
 */
interface BleHrClient {
    val state: BleHrState

    fun addStateListener(listener: BleHrStateListener)

    fun removeStateListener(listener: BleHrStateListener)

    fun addSampleListener(listener: BleHrSampleListener)

    fun removeSampleListener(listener: BleHrSampleListener)

    /** Begin scan/connect (or start fake stream). */
    fun start()

    /** Disconnect and return to idle. */
    fun stop()
}
