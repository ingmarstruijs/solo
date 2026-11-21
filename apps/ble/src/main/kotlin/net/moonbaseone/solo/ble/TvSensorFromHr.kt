package net.moonbaseone.solo.ble

import net.moonbaseone.solo.contracts.TvSensorState

/** Map live BLE HR into the phone→TV sensor strip fields. */
fun tvSensorFromHr(
    state: BleHrState,
    cameraEnabled: Boolean = false,
    garminConnected: Boolean = false,
): TvSensorState {
    val connected = state is BleHrState.Connected
    val bpm = state.liveBpm
    return TvSensorState(
        cameraEnabled = cameraEnabled,
        garminConnected = garminConnected,
        heartRateLive = connected && bpm != null,
        heartRateBpm = bpm,
        velocityDropPercent = 0.0,
        heartRatePercentMax = bpm?.let { bpmToPercentMax(it) } ?: 0.0,
    )
}
