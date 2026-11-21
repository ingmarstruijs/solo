package net.moonbaseone.solo.contracts

import java.io.File
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class TvMessageCodecTest {
    private val goldensDir: File =
        File(
            System.getProperty("solo.contracts.goldens")
                ?: error("solo.contracts.goldens system property missing"),
        )

    @Test
    fun roundTripsAllGoldens() {
        val files = goldensDir.listFiles { f -> f.extension == "json" }?.sortedBy { it.name }
        assertTrue("expected goldens in $goldensDir", !files.isNullOrEmpty())

        for (file in files!!) {
            val raw = file.readText()
            val decoded = TvMessageCodec.decode(raw)
            assertEquals(
                "schemaVersion for ${file.name}",
                TV_SCHEMA_VERSION,
                decoded.schemaVersion,
            )
            val encoded = TvMessageCodec.encode(decoded)
            val again = TvMessageCodec.decode(encoded)
            assertEquals("round-trip type for ${file.name}", decoded::class, again::class)
            assertEquals("round-trip mode for ${file.name}", decoded.mode, again.mode)
            // Canonical JSON compare (parse both) so key order / whitespace don't matter.
            val originalTree = Json.parseToJsonElement(raw).jsonObject
            val encodedTree = Json.parseToJsonElement(encoded).jsonObject
            assertEquals(
                "semantic equality for ${file.name}",
                originalTree["mode"],
                encodedTree["mode"],
            )
            assertEquals(originalTree["schemaVersion"], encodedTree["schemaVersion"])
            assertEquals(originalTree["theme"], encodedTree["theme"])
        }
    }

    @Test
    fun restGolden_hasActiveRest() {
        val rest = TvMessageCodec.decode(File(goldensDir, "rest.json").readText()) as TvMessage.Session
        assertTrue(rest.rest.active)
        assertEquals("exercise", rest.rest.kind)
    }

    @Test
    fun rejectsUnknownMode() {
        val raw =
            """
            {"schemaVersion":1,"mode":"teleport","theme":"midnight","updatedAt":"2026-11-21T12:00:00.000Z"}
            """.trimIndent()
        val ex =
            assertThrows(TvMessageCodecException::class.java) {
                TvMessageCodec.decode(raw)
            }
        assertTrue(ex.message!!.contains("unknown mode"))
    }

    @Test
    fun rejectsWrongSchemaVersion() {
        val raw =
            """
            {"schemaVersion":99,"mode":"idle","theme":"midnight","updatedAt":"2026-11-21T12:00:00.000Z"}
            """.trimIndent()
        val ex =
            assertThrows(TvMessageCodecException::class.java) {
                TvMessageCodec.decode(raw)
            }
        assertTrue(ex.message!!.contains("schemaVersion"))
    }

    @Test
    fun rejectsUnknownKeys() {
        val raw =
            """
            {
              "schemaVersion": 1,
              "mode": "idle",
              "theme": "midnight",
              "updatedAt": "2026-11-21T12:00:00.000Z",
              "extraField": true
            }
            """.trimIndent()
        assertThrows(TvMessageCodecException::class.java) {
            TvMessageCodec.decode(raw)
        }
    }

    @Test
    fun encodeRequiresCurrentSchemaVersion() {
        val bad =
            TvMessage.Idle(
                schemaVersion = 0,
                theme = "midnight",
                updatedAt = "2026-11-21T12:00:00.000Z",
            )
        assertThrows(IllegalArgumentException::class.java) {
            TvMessageCodec.encode(bad)
        }
    }

    @Test
    fun peekMode_readsDiscriminator() {
        val raw = File(goldensDir, "prep.json").readText()
        assertEquals("prep", TvMessageCodec.peekMode(raw))
    }

    @Test
    fun goldensCoverRequiredModes() {
        val names = goldensDir.listFiles()!!.map { it.nameWithoutExtension }.toSet()
        assertTrue(names.containsAll(setOf("idle", "prep", "setup", "session", "rest", "summary")))
    }
}
