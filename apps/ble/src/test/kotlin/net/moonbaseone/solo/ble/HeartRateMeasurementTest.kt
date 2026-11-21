package net.moonbaseone.solo.ble

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class HeartRateMeasurementTest {
    @Test
    fun parseUint8() {
        // flags=0, bpm=72
        assertEquals(72, parseHeartRateMeasurement(byteArrayOf(0x00, 72)))
    }

    @Test
    fun parseUint16LittleEndian() {
        // flags bit0 set, bpm=300 → 0x2C 0x01
        assertEquals(300, parseHeartRateMeasurement(byteArrayOf(0x01, 0x2C, 0x01)))
    }

    @Test
    fun rejectsEmpty() {
        assertThrows(IllegalArgumentException::class.java) {
            parseHeartRateMeasurement(byteArrayOf())
        }
    }

    @Test
    fun bpmToPercentMax_capsAt100() {
        assertEquals(0.0, bpmToPercentMax(0), 0.001)
        assertEquals(50.0, bpmToPercentMax(95, maxBpm = 190), 0.001)
        assertEquals(100.0, bpmToPercentMax(220, maxBpm = 190), 0.001)
    }
}
