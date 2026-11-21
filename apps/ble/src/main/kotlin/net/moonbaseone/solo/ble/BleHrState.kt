package net.moonbaseone.solo.ble

/**
 * Phone HR monitor connection FSM (mirrors React `HrConnectionStatus`).
 */
sealed interface BleHrState {
    data object Idle : BleHrState

    data object Unsupported : BleHrState

    data object Scanning : BleHrState

    data class Connecting(
        val deviceName: String? = null,
    ) : BleHrState

    data class Connected(
        val deviceName: String,
        val bpm: Int? = null,
        val sampleAtMillis: Long? = null,
    ) : BleHrState

    data class Disconnected(
        val reason: String? = null,
    ) : BleHrState

    data class Error(
        val message: String,
    ) : BleHrState
}

val BleHrState.liveBpm: Int?
    get() = (this as? BleHrState.Connected)?.bpm

fun interface BleHrStateListener {
    fun onState(state: BleHrState)
}

fun interface BleHrSampleListener {
    fun onSample(sample: HeartRateSample)
}
