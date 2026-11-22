package net.moonbaseone.solo.ble

import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class FakeBleHrClientTest {
    private val client = FakeBleHrClient()

    @After
    fun tearDown() {
        client.shutdown()
    }

    @Test
    fun start_reachesConnected() {
        val states = CopyOnWriteArrayList<BleHrState>()
        client.addStateListener { states += it }
        client.start()
        assertTrue(client.state is BleHrState.Connected)
        assertTrue(states.any { it is BleHrState.Scanning })
        assertTrue(states.any { it is BleHrState.Connecting })
        assertEquals("Fake HRM", (client.state as BleHrState.Connected).deviceName)
    }

    @Test
    fun pushSample_updatesConnectedBpmAndListeners() {
        val samples = CopyOnWriteArrayList<HeartRateSample>()
        client.addSampleListener { samples += it }
        client.start()
        client.pushSample(128, timestampMillis = 1_000L)

        val connected = client.state as BleHrState.Connected
        assertEquals(128, connected.bpm)
        assertEquals(1_000L, connected.sampleAtMillis)
        assertEquals(1, samples.size)
        assertEquals(128, samples[0].bpm)
        assertEquals(128, client.state.liveBpm)
    }

    @Test
    fun stop_returnsIdle() {
        client.start()
        client.pushSample(90)
        client.stop()
        assertEquals(BleHrState.Idle, client.state)
        assertNull(client.state.liveBpm)
    }

    @Test
    fun disconnect_emitsDisconnected() {
        client.start()
        client.disconnect("link loss")
        val state = client.state as BleHrState.Disconnected
        assertEquals("link loss", state.reason)
    }

    @Test
    fun ticker_emitsSequence() {
        val latch = CountDownLatch(3)
        val ticking =
            FakeBleHrClient(
                sampleIntervalMs = 20,
                bpmSequence = listOf(70, 80, 90),
            )
        try {
            ticking.addSampleListener { latch.countDown() }
            ticking.start()
            assertTrue(latch.await(2, TimeUnit.SECONDS))
            assertTrue(ticking.state.liveBpm != null)
        } finally {
            ticking.shutdown()
        }
    }

    @Test
    fun tvSensorFromHr_mapsLiveFields() {
        client.start()
        client.pushSample(142)
        val sensor = tvSensorFromHr(client.state)
        assertTrue(sensor.heartRateLive)
        assertEquals(142, sensor.heartRateBpm)
        assertEquals(bpmToPercentMax(142), sensor.heartRatePercentMax, 0.001)
    }
}
