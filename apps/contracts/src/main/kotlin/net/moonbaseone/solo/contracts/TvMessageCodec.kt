package net.moonbaseone.solo.contracts

import kotlinx.serialization.SerializationException
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonPrimitive

class TvMessageCodecException(message: String, cause: Throwable? = null) :
    IllegalArgumentException(message, cause)

object TvMessageCodec {
    val json: Json =
        Json {
            ignoreUnknownKeys = false
            encodeDefaults = true
            explicitNulls = true
            classDiscriminator = "mode"
        }

    fun encode(message: TvMessage): String {
        require(message.schemaVersion == TV_SCHEMA_VERSION) {
            "unsupported schemaVersion=${message.schemaVersion}; expected $TV_SCHEMA_VERSION"
        }
        return json.encodeToString(TvMessage.serializer(), message)
    }

    fun decode(raw: String): TvMessage {
        val element =
            try {
                json.parseToJsonElement(raw)
            } catch (e: SerializationException) {
                throw TvMessageCodecException("invalid JSON", e)
            }
        return decode(element)
    }

    fun decode(element: JsonElement): TvMessage {
        val obj =
            element as? JsonObject
                ?: throw TvMessageCodecException("TvMessage must be a JSON object")

        val version =
            obj["schemaVersion"]?.jsonPrimitive?.intOrNull
                ?: throw TvMessageCodecException("missing schemaVersion")
        if (version != TV_SCHEMA_VERSION) {
            throw TvMessageCodecException(
                "unsupported schemaVersion=$version; expected $TV_SCHEMA_VERSION",
            )
        }

        val mode =
            obj["mode"]?.jsonPrimitive?.contentOrNull
                ?: throw TvMessageCodecException("missing mode")

        // Reject unknown top-level modes early with a clear error.
        val known = setOf("idle", "prep", "setup", "session", "summary")
        if (mode !in known) {
            throw TvMessageCodecException("unknown mode=$mode")
        }

        return try {
            json.decodeFromJsonElement(TvMessage.serializer(), obj)
        } catch (e: SerializationException) {
            throw TvMessageCodecException("failed to decode mode=$mode: ${e.message}", e)
        }
    }

    /** True when [raw] looks like a supported TvMessage envelope. */
    fun peekMode(raw: String): String? {
        val obj = json.parseToJsonElement(raw) as? JsonObject ?: return null
        return (obj["mode"] as? JsonPrimitive)?.contentOrNull
    }
}
