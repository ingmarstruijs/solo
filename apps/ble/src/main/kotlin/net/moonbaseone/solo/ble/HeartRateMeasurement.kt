package net.moonbaseone.solo.ble

/** Standard GATT Heart Rate Service / Measurement UUIDs (16-bit form). */
object BleHrUuids {
    const val SERVICE: String = "0000180d-0000-1000-8000-00805f9b34fb"
    const val MEASUREMENT: String = "00002a37-0000-1000-8000-00805f9b34fb"
    const val CLIENT_CHARACTERISTIC_CONFIG: String = "00002902-0000-1000-8000-00805f9b34fb"
}

data class HeartRateSample(
    val bpm: Int,
    val timestampMillis: Long,
)

/**
 * Parse BLE Heart Rate Measurement (0x2A37).
 * Flags bit0: 0 = UINT8 bpm at offset 1, 1 = UINT16 LE bpm at offset 1.
 */
fun parseHeartRateMeasurement(payload: ByteArray): Int {
    require(payload.isNotEmpty()) { "empty Heart Rate Measurement" }
    val flags = payload[0].toInt() and 0xff
    val isUint16 = flags and 0x01 != 0
    return if (isUint16) {
        require(payload.size >= 3) { "UINT16 HR needs 3 bytes, got ${payload.size}" }
        (payload[1].toInt() and 0xff) or ((payload[2].toInt() and 0xff) shl 8)
    } else {
        require(payload.size >= 2) { "UINT8 HR needs 2 bytes, got ${payload.size}" }
        payload[1].toInt() and 0xff
    }
}

/** Age-free % of max HR for TV HUD (default 190 bpm ≈ 100%). */
fun bpmToPercentMax(bpm: Int, maxBpm: Int = 190): Double {
    if (bpm <= 0 || maxBpm <= 0) return 0.0
    return minOf(100.0, (bpm.toDouble() / maxBpm) * 100.0)
}
