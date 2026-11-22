package net.moonbaseone.solo

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import net.moonbaseone.solo.ble.BleHrState
import net.moonbaseone.solo.ble.liveBpm
import net.moonbaseone.solo.contracts.TV_SCHEMA_VERSION
import net.moonbaseone.solo.contracts.TvMessage
import net.moonbaseone.solo.data.SoloRepository
import net.moonbaseone.solo.domain.activatePrep
import net.moonbaseone.solo.domain.advanceToNextSet
import net.moonbaseone.solo.domain.allExercisesDoneInSet
import net.moonbaseone.solo.domain.clearExpiredRest
import net.moonbaseone.solo.domain.completeExercise
import net.moonbaseone.solo.domain.finishSession
import net.moonbaseone.solo.domain.idleTvMessage
import net.moonbaseone.solo.domain.isLastSet
import net.moonbaseone.solo.domain.prepareSession
import net.moonbaseone.solo.domain.prepTvMessage
import net.moonbaseone.solo.domain.restoreSessionAfterDeath
import net.moonbaseone.solo.domain.sessionTvMessage
import net.moonbaseone.solo.domain.setupTvMessage
import net.moonbaseone.solo.domain.skipRest
import net.moonbaseone.solo.domain.startExercises
import net.moonbaseone.solo.domain.summaryTvMessage
import net.moonbaseone.solo.domain.model.SoloSnapshot
import net.moonbaseone.solo.transport.OkHttpTvSocketClient
import net.moonbaseone.solo.transport.PairPayload
import net.moonbaseone.solo.transport.PairingState
import net.moonbaseone.solo.transport.PhoneDialSession
class SoloViewModel(
    application: Application,
) : AndroidViewModel(application) {
    private val repo = SoloRepository(application)

    val snapshot: StateFlow<SoloSnapshot> =
        repo.snapshot.stateIn(
            viewModelScope,
            SharingStarted.Eagerly,
            SoloSnapshot(),
        )

    private val _pairingState = MutableStateFlow<PairingState>(PairingState.Idle)
    val pairingState: StateFlow<PairingState> = _pairingState.asStateFlow()

    private val _hrState = MutableStateFlow<BleHrState>(BleHrState.Idle)
    val hrState: StateFlow<BleHrState> = _hrState.asStateFlow()

    private val _hrSource = MutableStateFlow("off")
    val hrSource: StateFlow<String> = _hrSource.asStateFlow()

    private val dialClient = OkHttpTvSocketClient()
    private var dialSession: PhoneDialSession? = null
    private var restored = false

    init {
        viewModelScope.launch {
            repo.ensureSeeded()
            // Apply process-death restore once snapshot is available.
            snapshot.collect { snap ->
                if (!restored && snap.activeSession != null) {
                    restored = true
                    val fixed = restoreSessionAfterDeath(snap.activeSession!!)
                    if (fixed != snap.activeSession) {
                        repo.update { it.copy(activeSession = fixed) }
                    }
                } else if (snap.seeded) {
                    restored = true
                }
            }
        }
    }

    fun setRecovery(score: Double) {
        viewModelScope.launch {
            repo.update { it.copy(recoveryScore = score.coerceIn(0.0, 100.0)) }
        }
    }

    fun prepareSelected(workoutIds: List<String>) {
        viewModelScope.launch {
            val snap = snapshot.value
            val workouts = snap.workouts.filter { it.id in workoutIds }
            val prep =
                prepareSession(workouts, snap.locker, snap.recoveryScore) ?: return@launch
            repo.update { it.copy(prep = prep) }
            broadcast { prepTvMessage(prep, it.theme) }
        }
    }

    fun startFromPrep() {
        viewModelScope.launch {
            val prep = snapshot.value.prep ?: return@launch
            val session = activatePrep(prep) ?: return@launch
            repo.update { it.copy(activeSession = session, prep = null) }
            broadcast { setupTvMessage(session, it.theme) }
        }
    }

    fun beginExercises() {
        mutateSession { startExercises(it) }
    }

    fun markExerciseDone(exerciseId: String) {
        mutateSession { completeExercise(it, exerciseId) }
    }

    fun skipRestNow() {
        mutateSession { session ->
            var next = skipRest(session)
            if (allExercisesDoneInSet(next) && !isLastSet(next)) {
                next = advanceToNextSet(next)
            }
            next
        }
    }

    fun finishWorkout() {
        viewModelScope.launch {
            val session = snapshot.value.activeSession ?: return@launch
            val entry = finishSession(session)
            repo.update {
                it.copy(
                    activeSession = null,
                    history = listOf(entry) + it.history,
                )
            }
            broadcast { summaryTvMessage(entry, it.theme) }
        }
    }

    fun cancelSession() {
        viewModelScope.launch {
            repo.update { it.copy(activeSession = null, prep = null) }
            broadcast { idleTvMessage(it.theme) }
        }
    }

    fun connectTv(
        host: String,
        port: Int,
        code: String,
    ) {
        dialSession?.disconnect()
        lateinit var session: PhoneDialSession
        session =
            PhoneDialSession(
                payload =
                    PairPayload(
                        host = host.trim(),
                        port = port,
                        nonce = code.trim().uppercase(),
                        schemaVersion = TV_SCHEMA_VERSION,
                    ),
                stateListener = { state ->
                    _pairingState.value = state
                    if (state is PairingState.Paired) {
                        pushCurrentHud()
                    }
                },
            )
        dialSession = session
        session.connect(dialClient)
    }

    fun disconnectTv() {
        dialSession?.disconnect()
        dialSession = null
        _pairingState.value = PairingState.Idle
    }

    fun setHrState(
        state: BleHrState,
        source: String,
    ) {
        _hrState.value = state
        _hrSource.value = source
        val session = snapshot.value.activeSession
        if (session != null && session.exercisesStarted && dialSession != null) {
            broadcast {
                sessionTvMessage(session, it.theme, heartRateBpm = state.liveBpm)
            }
        }
    }

    private fun mutateSession(block: (net.moonbaseone.solo.domain.model.ActiveSession) -> net.moonbaseone.solo.domain.model.ActiveSession) {
        viewModelScope.launch {
            repo.update { snap ->
                val current = snap.activeSession ?: return@update snap
                val next = block(current)
                snap.copy(activeSession = next)
            }
            pushCurrentHud()
        }
    }

    private fun pushCurrentHud() {
        val snap = snapshot.value
        val session = snap.activeSession
        val msg: TvMessage =
            when {
                session == null -> idleTvMessage(snap.theme)
                !session.exercisesStarted -> setupTvMessage(session, snap.theme)
                else ->
                    sessionTvMessage(
                        clearExpiredRest(session),
                        snap.theme,
                        heartRateBpm = _hrState.value.liveBpm,
                    )
            }
        sendTv(msg)
    }

    private fun broadcast(build: (SoloSnapshot) -> TvMessage) {
        sendTv(build(snapshot.value))
    }

    private fun sendTv(message: TvMessage) {
        try {
            dialSession?.send(message)
        } catch (_: Exception) {
            // Best-effort HUD push.
        }
    }

    override fun onCleared() {
        disconnectTv()
        super.onCleared()
    }
}
