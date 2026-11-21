package net.moonbaseone.solo.transport

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive
import net.moonbaseone.solo.contracts.TV_SCHEMA_VERSION

/**
 * WebSocket control frames exchanged before TvMessage traffic.
 * Discriminated by JSON field `type`.
 */
@Serializable
sealed interface ControlFrame {
    @Serializable
    @SerialName("hello")
    data class Hello(
        val nonce: String,
        val schemaVersion: Int = TV_SCHEMA_VERSION,
    ) : ControlFrame

    @Serializable
    @SerialName("welcome")
    data class Welcome(
        val schemaVersion: Int = TV_SCHEMA_VERSION,
    ) : ControlFrame

    @Serializable
    @SerialName("reject")
    data class Reject(
        val reason: String,
    ) : ControlFrame
}

object ControlFrameCodec {
    val json: Json =
        Json {
            ignoreUnknownKeys = false
            encodeDefaults = true
            classDiscriminator = "type"
        }

    fun encode(frame: ControlFrame): String = json.encodeToString(ControlFrame.serializer(), frame)

    fun decode(raw: String): ControlFrame =
        json.decodeFromString(ControlFrame.serializer(), raw)

    /** True when [raw] looks like a control frame (has `type`), not a TvMessage. */
    fun looksLikeControl(raw: String): Boolean {
        val element =
            try {
                json.parseToJsonElement(raw)
            } catch (_: Exception) {
                return false
            }
        val obj = element as? JsonObject ?: return false
        return obj["type"]?.jsonPrimitive?.contentOrNull != null
    }
}
