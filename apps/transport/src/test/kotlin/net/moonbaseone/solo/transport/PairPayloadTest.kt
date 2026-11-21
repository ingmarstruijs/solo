package net.moonbaseone.solo.transport

import net.moonbaseone.solo.contracts.TV_SCHEMA_VERSION
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class PairPayloadTest {
    @Test
    fun roundTripsPayload() {
        val payload =
            PairPayload(
                host = "192.168.1.20",
                port = 8787,
                nonce = "AB12CD",
                schemaVersion = TV_SCHEMA_VERSION,
            )
        val raw = PairPayloadCodec.encode(payload)
        val again = PairPayloadCodec.decode(raw)
        assertEquals(payload, again)
        assertEquals("AB12CD", again.displayCode)
    }

    @Test
    fun generateNonce_isSixChars() {
        val nonce = generatePairNonce()
        assertEquals(6, nonce.length)
        assertTrue(nonce.matches(Regex("^[A-Z0-9]{6}$")))
    }

    @Test
    fun rejectsWrongSchemaVersion() {
        val raw =
            """
            {"host":"10.0.0.1","port":8787,"nonce":"AB12CD","schemaVersion":99}
            """.trimIndent()
        assertThrows(IllegalArgumentException::class.java) {
            PairPayloadCodec.decode(raw)
        }
    }

    @Test
    fun rejectsBadNonce() {
        val raw =
            """
            {"host":"10.0.0.1","port":8787,"nonce":"short","schemaVersion":1}
            """.trimIndent()
        assertThrows(IllegalArgumentException::class.java) {
            PairPayloadCodec.decode(raw)
        }
    }
}
