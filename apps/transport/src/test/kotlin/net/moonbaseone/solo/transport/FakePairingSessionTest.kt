package net.moonbaseone.solo.transport

import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import net.moonbaseone.solo.contracts.TV_SCHEMA_VERSION
import net.moonbaseone.solo.contracts.TvMessage
import net.moonbaseone.solo.contracts.mode
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class FakePairingSessionTest {
    @Test
    fun happyPath_pairAndSendIdle() {
        val pair = FakeTvSocketPair(port = 8787)
        val nonce = "AB12CD"
        val received = CopyOnWriteArrayList<TvMessage>()
        val pairedLatch = CountDownLatch(2)

        val tv =
            TvListenSession(
                expectedNonce = nonce,
                stateListener = { if (it is PairingState.Paired) pairedLatch.countDown() },
                messageListener = { received += it },
            )
        tv.bind(pair.server)

        val phone =
            PhoneDialSession(
                payload =
                    PairPayload(
                        host = "127.0.0.1",
                        port = 8787,
                        nonce = nonce,
                        schemaVersion = TV_SCHEMA_VERSION,
                    ),
                stateListener = { if (it is PairingState.Paired) pairedLatch.countDown() },
            )
        phone.connect(pair.client)

        assertTrue("pair timeout", pairedLatch.await(2, TimeUnit.SECONDS))
        assertEquals(PairingState.Paired, tv.currentState)
        assertEquals(PairingState.Paired, phone.currentState)

        phone.send(
            TvMessage.Idle(
                theme = "midnight",
                updatedAt = "2026-11-21T12:00:00.000Z",
            ),
        )

        val deadline = System.currentTimeMillis() + 2_000
        while (received.isEmpty() && System.currentTimeMillis() < deadline) {
            Thread.sleep(5)
        }
        assertEquals(1, received.size)
        assertTrue(received[0] is TvMessage.Idle)
        assertEquals("idle", received[0].mode)
    }

    @Test
    fun rejectsWrongNonce() {
        val pair = FakeTvSocketPair()
        val failLatch = CountDownLatch(1)

        TvListenSession(expectedNonce = "RIGHT1").bind(pair.server)

        val phone =
            PhoneDialSession(
                payload =
                    PairPayload(
                        host = "127.0.0.1",
                        port = DEFAULT_TV_WS_PORT,
                        nonce = "WRONG1",
                    ),
                stateListener = {
                    if (it is PairingState.Failed) failLatch.countDown()
                },
            )
        phone.connect(pair.client)

        assertTrue(failLatch.await(2, TimeUnit.SECONDS))
        assertTrue(phone.currentState is PairingState.Failed)
    }

    @Test
    fun controlFrame_roundTrip() {
        val hello = ControlFrame.Hello(nonce = "AB12CD")
        val raw = ControlFrameCodec.encode(hello)
        val again = ControlFrameCodec.decode(raw) as ControlFrame.Hello
        assertEquals("AB12CD", again.nonce)
        assertTrue(ControlFrameCodec.looksLikeControl(raw))
        assertTrue(
            !ControlFrameCodec.looksLikeControl(
                """{"schemaVersion":1,"mode":"idle","theme":"midnight","updatedAt":"t"}""",
            ),
        )
    }
}
