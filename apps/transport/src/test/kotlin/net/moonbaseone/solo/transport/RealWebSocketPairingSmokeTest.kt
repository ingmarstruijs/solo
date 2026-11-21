package net.moonbaseone.solo.transport

import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import net.moonbaseone.solo.contracts.TV_SCHEMA_VERSION
import net.moonbaseone.solo.contracts.TvMessage
import net.moonbaseone.solo.contracts.mode
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Pair-smoke over real OkHttp client ↔ Java-WebSocket server on loopback.
 * CI gate for PR E until dual Android emulators + Maestro run in Actions.
 */
class RealWebSocketPairingSmokeTest {
    private var server: JavaWebSocketTvServer? = null

    @After
    fun tearDown() {
        server?.stop()
        server = null
    }

    @Test
    fun loopback_pairAndDeliverIdle() {
        val nonce = generatePairNonce()
        val received = CopyOnWriteArrayList<TvMessage>()
        val pairedLatch = CountDownLatch(2)

        val tvServer = JavaWebSocketTvServer(port = 0)
        server = tvServer

        val tv =
            TvListenSession(
                expectedNonce = nonce,
                stateListener = { if (it is PairingState.Paired) pairedLatch.countDown() },
                messageListener = { received += it },
            )
        tv.bind(tvServer)

        val port = tvServer.localPort
        assertTrue("expected ephemeral bind port, got $port", port in 1..65535)

        val phone =
            PhoneDialSession(
                payload =
                    PairPayload(
                        host = "127.0.0.1",
                        port = port,
                        nonce = nonce,
                        schemaVersion = TV_SCHEMA_VERSION,
                    ),
                stateListener = { if (it is PairingState.Paired) pairedLatch.countDown() },
            )
        phone.connect(OkHttpTvSocketClient())

        assertTrue("pair timeout on real WS", pairedLatch.await(8, TimeUnit.SECONDS))
        assertEquals(PairingState.Paired, tv.currentState)
        assertEquals(PairingState.Paired, phone.currentState)

        phone.send(
            TvMessage.Idle(
                theme = "midnight",
                updatedAt = "2026-11-21T14:00:00.000Z",
            ),
        )

        val deadline = System.currentTimeMillis() + 5_000
        while (received.isEmpty() && System.currentTimeMillis() < deadline) {
            Thread.sleep(20)
        }
        assertEquals(1, received.size)
        assertTrue(received[0] is TvMessage.Idle)
        assertEquals("idle", received[0].mode)

        phone.disconnect()
        tv.stop(tvServer)
        server = null
    }

    @Test
    fun loopback_rejectsWrongNonce() {
        val tvServer = JavaWebSocketTvServer(port = 0)
        server = tvServer
        val failLatch = CountDownLatch(1)

        TvListenSession(expectedNonce = "RIGHT1").bind(tvServer)
        val port = tvServer.localPort

        PhoneDialSession(
            payload =
                PairPayload(
                    host = "127.0.0.1",
                    port = port,
                    nonce = "WRONG1",
                ),
            stateListener = {
                if (it is PairingState.Failed) failLatch.countDown()
            },
        ).connect(OkHttpTvSocketClient())

        assertTrue("reject timeout", failLatch.await(8, TimeUnit.SECONDS))
        tvServer.stop()
        server = null
    }
}
