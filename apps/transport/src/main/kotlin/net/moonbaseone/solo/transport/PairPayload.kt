package net.moonbaseone.solo.transport

import java.security.SecureRandom
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import net.moonbaseone.solo.contracts.TV_SCHEMA_VERSION

/** Default LAN listen port for the Android TV WebSocket server. */
const val DEFAULT_TV_WS_PORT: Int = 8787

private val PAIR_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray()
private val secureRandom = SecureRandom()

/**
 * QR / manual pair payload. TV shows this; phone dials `ws://host:port`
 * and authenticates with [nonce].
 */
@Serializable
data class PairPayload(
    val host: String,
    val port: Int = DEFAULT_TV_WS_PORT,
    val nonce: String,
    val schemaVersion: Int = TV_SCHEMA_VERSION,
) {
    /** Human-facing code (same as [nonce] for v1 — short, no ambiguous chars). */
    val displayCode: String get() = nonce
}

object PairPayloadCodec {
    val json: Json =
        Json {
            ignoreUnknownKeys = false
            encodeDefaults = true
            explicitNulls = false
        }

    fun encode(payload: PairPayload): String = json.encodeToString(payload)

    fun decode(raw: String): PairPayload {
        val payload = json.decodeFromString(PairPayload.serializer(), raw)
        require(payload.host.isNotBlank()) { "host required" }
        require(payload.port in 1..65535) { "invalid port=${payload.port}" }
        require(payload.nonce.matches(Regex("^[A-Z0-9]{6}$"))) {
            "nonce must be 6 A-Z/0-9 chars"
        }
        require(payload.schemaVersion == TV_SCHEMA_VERSION) {
            "unsupported schemaVersion=${payload.schemaVersion}; expected $TV_SCHEMA_VERSION"
        }
        return payload
    }
}

/** Cryptographically random 6-character pair nonce (excludes ambiguous I/O/0/1). */
fun generatePairNonce(length: Int = 6): String {
    require(length in 4..12)
    val chars = CharArray(length)
    for (i in 0 until length) {
        chars[i] = PAIR_ALPHABET[secureRandom.nextInt(PAIR_ALPHABET.size)]
    }
    return String(chars)
}
