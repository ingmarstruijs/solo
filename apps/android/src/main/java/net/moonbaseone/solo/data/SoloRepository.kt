package net.moonbaseone.solo.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import net.moonbaseone.solo.domain.DomainJson
import net.moonbaseone.solo.domain.SeedData
import net.moonbaseone.solo.domain.model.SoloSnapshot

private val Context.soloDataStore: DataStore<Preferences> by preferencesDataStore(name = "solo_snapshot")

class SoloRepository(
    private val context: Context,
) {
    private val key = stringPreferencesKey("snapshot_json")

    val snapshot: Flow<SoloSnapshot> =
        context.soloDataStore.data.map { prefs ->
            val raw = prefs[key]
            if (raw.isNullOrBlank()) {
                seedSnapshot()
            } else {
                runCatching {
                    DomainJson.decodeFromString(SoloSnapshot.serializer(), raw)
                }.getOrElse { seedSnapshot() }
            }
        }

    suspend fun update(transform: (SoloSnapshot) -> SoloSnapshot) {
        context.soloDataStore.edit { prefs ->
            val current =
                prefs[key]?.let { raw ->
                    runCatching {
                        DomainJson.decodeFromString(SoloSnapshot.serializer(), raw)
                    }.getOrNull()
                } ?: seedSnapshot()
            val next = transform(current)
            prefs[key] = DomainJson.encodeToString(SoloSnapshot.serializer(), next)
        }
    }

    suspend fun ensureSeeded() {
        context.soloDataStore.edit { prefs ->
            if (prefs[key].isNullOrBlank()) {
                prefs[key] = DomainJson.encodeToString(SoloSnapshot.serializer(), seedSnapshot())
            }
        }
    }

    private fun seedSnapshot(): SoloSnapshot =
        SoloSnapshot(
            workouts = SeedData.workouts,
            locker = SeedData.locker,
            history = emptyList(),
            activeSession = null,
            prep = null,
            recoveryScore = 100.0,
            theme = "midnight",
            seeded = true,
        )
}
