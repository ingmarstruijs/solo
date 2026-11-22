package net.moonbaseone.solo.coach

import android.content.Context
import android.speech.tts.TextToSpeech
import java.util.Locale

/** Thin TTS wrapper for session coach lines (FOSS, on-device). */
class CoachSpeaker(
    context: Context,
) : TextToSpeech.OnInitListener {
    private var ready = false
    private val tts = TextToSpeech(context.applicationContext, this)

    override fun onInit(status: Int) {
        ready = status == TextToSpeech.SUCCESS
        if (ready) {
            tts.language = Locale.US
        }
    }

    fun speak(
        text: String,
        enabled: Boolean,
    ) {
        if (!enabled || !ready || text.isBlank()) return
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "solo-coach")
    }

    fun shutdown() {
        tts.stop()
        tts.shutdown()
    }
}
