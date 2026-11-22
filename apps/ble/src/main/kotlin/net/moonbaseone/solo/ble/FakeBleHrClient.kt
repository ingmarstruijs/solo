package net.moonbaseone.solo.ble

import java.util.concurrent.CopyOnWriteArraySet
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference

/**
 * In-memory HR client for JVM / CI. Drives the same FSM as a real band without GATT.
 */
class FakeBleHrClient(
    private val deviceName: String = "Fake HRM",
    private val sampleIntervalMs: Long = 0,
    private val bpmSequence: List<Int> = listOf(72, 88, 110, 128),
) : BleHrClient {
    private val stateRef = AtomicReference<BleHrState>(BleHrState.Idle)
    private val stateListeners = CopyOnWriteArraySet<BleHrStateListener>()
    private val sampleListeners = CopyOnWriteArraySet<BleHrSampleListener>()
    private val scheduler = Executors.newSingleThreadScheduledExecutor()
    private var ticker: ScheduledFuture<*>? = null
    private var sequenceIndex = 0

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

    override fun start() {
        setState(BleHrState.Scanning)
        setState(BleHrState.Connecting(deviceName))
        setState(BleHrState.Connected(deviceName = deviceName))
        if (sampleIntervalMs > 0 && bpmSequence.isNotEmpty()) {
            ticker?.cancel(false)
            ticker =
                scheduler.scheduleAtFixedRate(
                    {
                        val bpm = bpmSequence[sequenceIndex % bpmSequence.size]
                        sequenceIndex++
                        pushSample(bpm)
                    },
                    0,
                    sampleIntervalMs,
                    TimeUnit.MILLISECONDS,
                )
        }
    }

    override fun stop() {
        ticker?.cancel(false)
        ticker = null
        sequenceIndex = 0
        setState(BleHrState.Idle)
    }

    /** Test hook: inject a measurement as if GATT notified. */
    fun pushSample(bpm: Int, timestampMillis: Long = System.currentTimeMillis()) {
        val sample = HeartRateSample(bpm = bpm, timestampMillis = timestampMillis)
        val current = stateRef.get()
        if (current is BleHrState.Connected) {
            setState(
                current.copy(bpm = sample.bpm, sampleAtMillis = sample.timestampMillis),
            )
        }
        sampleListeners.forEach { it.onSample(sample) }
    }

    fun fail(message: String) {
        ticker?.cancel(false)
        ticker = null
        setState(BleHrState.Error(message))
    }

    fun disconnect(reason: String = "band gone") {
        ticker?.cancel(false)
        ticker = null
        setState(BleHrState.Disconnected(reason))
    }

    fun shutdown() {
        stop()
        scheduler.shutdownNow()
    }

    private fun setState(next: BleHrState) {
        stateRef.set(next)
        stateListeners.forEach { it.onState(next) }
    }
}
