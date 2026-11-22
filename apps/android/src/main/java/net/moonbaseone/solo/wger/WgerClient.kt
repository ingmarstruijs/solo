package net.moonbaseone.solo.wger

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.TimeUnit

data class WgerHit(
    val id: Int,
    val name: String,
    val description: String?,
)

class WgerClient(
    private val client: OkHttpClient =
        OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .build(),
) {
    suspend fun search(
        query: String,
        limit: Int = 20,
    ): List<WgerHit> =
        withContext(Dispatchers.IO) {
            val q = query.trim()
            if (q.isEmpty()) return@withContext emptyList()
            val url =
                "https://wger.de/api/v2/exerciseinfo/?limit=$limit&name__search=${java.net.URLEncoder.encode(q, "UTF-8")}&language__code=en"
            val req =
                Request.Builder()
                    .url(url)
                    .header("Accept", "application/json")
                    .get()
                    .build()
            client.newCall(req).execute().use { resp ->
                if (!resp.isSuccessful) return@withContext emptyList()
                val body = resp.body?.string().orEmpty()
                val results = JSONObject(body).optJSONArray("results") ?: return@withContext emptyList()
                buildList {
                    for (i in 0 until results.length()) {
                        val item = results.getJSONObject(i)
                        val translations = item.optJSONArray("translations")
                        var name = item.optString("name", "")
                        var description: String? = null
                        if (translations != null) {
                            for (t in 0 until translations.length()) {
                                val tr = translations.getJSONObject(t)
                                val n = tr.optString("name", "")
                                if (n.isNotBlank()) {
                                    name = n
                                    description = tr.optString("description").ifBlank { null }
                                    break
                                }
                            }
                        }
                        if (name.isBlank()) continue
                        add(
                            WgerHit(
                                id = item.optInt("id"),
                                name = name,
                                description = description,
                            ),
                        )
                    }
                }
            }
        }
}
