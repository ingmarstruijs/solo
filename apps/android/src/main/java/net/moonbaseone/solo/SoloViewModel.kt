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
import net.moonbaseone.solo.domain.activateQueuedWorkout
import net.moonbaseone.solo.domain.advanceToNextSet
import net.moonbaseone.solo.domain.allExercisesDoneInSet
import net.moonbaseone.solo.domain.clearExpiredRest
import net.moonbaseone.solo.domain.completeExercise
import net.moonbaseone.solo.domain.createLockerItem
import net.moonbaseone.solo.domain.createWorkout
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
import net.moonbaseone.solo.domain.toggleExercisePause
import net.moonbaseone.solo.domain.toggleFavorite
import net.moonbaseone.solo.domain.undoCompleteExercise
import net.moonbaseone.solo.domain.updateLockerItem
import net.moonbaseone.solo.domain.updateWorkout
import net.moonbaseone.solo.domain.model.EquipmentCategory
import net.moonbaseone.solo.domain.model.LockerItem
import net.moonbaseone.solo.domain.model.SoloSnapshot
import net.moonbaseone.solo.domain.model.WorkoutExercise
import net.moonbaseone.solo.domain.model.WorkoutTemplate
import net.moonbaseone.solo.domain.model.SOLO_THEMES
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

    fun setTheme(theme: String) {
        if (theme !in SOLO_THEMES) return
        viewModelScope.launch {
            repo.update { it.copy(theme = theme) }
            pushCurrentHud()
        }
    }

    fun setCoachEnabled(enabled: Boolean) {
        viewModelScope.launch {
            repo.update { it.copy(coachEnabled = enabled) }
        }
    }

    fun saveNewWorkout(
        name: String,
        description: String?,
        exercises: List<WorkoutExercise>,
        sets: Int,
        restBetweenSets: Int,
        circuitRounds: Int?,
        restBetweenRounds: Int?,
        favorite: Boolean,
    ) {
        viewModelScope.launch {
            val workout =
                createWorkout(
                    name = name,
                    description = description,
                    exercises = exercises,
                    sets = sets,
                    restBetweenSets = restBetweenSets,
                    circuitRounds = circuitRounds,
                    restBetweenRounds = restBetweenRounds,
                    favorite = favorite,
                )
            repo.update { it.copy(workouts = it.workouts + workout) }
        }
    }

    fun saveExistingWorkout(
        id: String,
        name: String,
        description: String?,
        exercises: List<WorkoutExercise>,
        sets: Int,
        restBetweenSets: Int,
        circuitRounds: Int?,
        restBetweenRounds: Int?,
        favorite: Boolean,
    ) {
        viewModelScope.launch {
            repo.update { snap ->
                val existing = snap.workouts.find { it.id == id } ?: return@update snap
                val updated =
                    updateWorkout(
                        existing = existing,
                        name = name,
                        description = description,
                        exercises = exercises,
                        sets = sets,
                        restBetweenSets = restBetweenSets,
                        circuitRounds = circuitRounds,
                        restBetweenRounds = restBetweenRounds,
                        favorite = favorite,
                    )
                snap.copy(workouts = snap.workouts.map { if (it.id == id) updated else it })
            }
        }
    }

    fun deleteWorkout(id: String) {
        viewModelScope.launch {
            repo.update { it.copy(workouts = it.workouts.filterNot { w -> w.id == id }) }
        }
    }

    fun toggleWorkoutFavorite(id: String) {
        viewModelScope.launch {
            repo.update { snap ->
                snap.copy(
                    workouts =
                        snap.workouts.map { w ->
                            if (w.id == id) toggleFavorite(w) else w
                        },
                )
            }
        }
    }

    fun saveLockerItem(
        existingId: String?,
        name: String,
        brand: String,
        category: EquipmentCategory,
        weightKg: Double?,
        resistance: String?,
        notes: String?,
    ) {
        viewModelScope.launch {
            repo.update { snap ->
                if (existingId == null) {
                    val item =
                        createLockerItem(
                            name = name,
                            brand = brand,
                            category = category,
                            weightKg = weightKg,
                            resistance = resistance,
                            notes = notes,
                        )
                    snap.copy(locker = snap.locker + item)
                } else {
                    val existing = snap.locker.find { it.id == existingId } ?: return@update snap
                    val updated =
                        updateLockerItem(
                            existing,
                            name = name,
                            brand = brand,
                            category = category,
                            weightKg = weightKg,
                            resistance = resistance,
                            notes = notes,
                        )
                    snap.copy(locker = snap.locker.map { if (it.id == existingId) updated else it })
                }
            }
        }
    }

    fun deleteLockerItem(id: String) {
        viewModelScope.launch {
            repo.update { it.copy(locker = it.locker.filterNot { item -> item.id == id }) }
        }
    }

    fun workoutById(id: String): WorkoutTemplate? = snapshot.value.workouts.find { it.id == id }

    fun lockerById(id: String): LockerItem? = snapshot.value.locker.find { it.id == id }

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
            val activated = activatePrep(prep) ?: return@launch
            repo.update {
                it.copy(
                    activeSession = activated.session,
                    prep = null,
                    workoutQueue = activated.remainingQueue,
                )
            }
            broadcast { setupTvMessage(activated.session, it.theme) }
        }
    }

    fun beginExercises() {
        mutateSession { startExercises(it) }
    }

    fun markExerciseDone(exerciseId: String) {
        mutateSession { completeExercise(it, exerciseId) }
    }

    fun undoExercise(exerciseId: String) {
        mutateSession { undoCompleteExercise(it, exerciseId) }
    }

    fun togglePause(exerciseId: String) {
        mutateSession { toggleExercisePause(it, exerciseId) }
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

    fun finishWorkout(onDone: (queuedNext: Boolean) -> Unit = {}) {
        viewModelScope.launch {
            val session = snapshot.value.activeSession ?: return@launch
            val entry = finishSession(session)
            val queue = snapshot.value.workoutQueue
            if (queue.isNotEmpty()) {
                val next = queue.first()
                val nextSession =
                    activateQueuedWorkout(next, snapshot.value.recoveryScore)
                repo.update {
                    it.copy(
                        activeSession = nextSession,
                        workoutQueue = queue.drop(1),
                        history = listOf(entry) + it.history,
                    )
                }
                broadcast { setupTvMessage(nextSession, it.theme) }
                onDone(true)
            } else {
                repo.update {
                    it.copy(
                        activeSession = null,
                        workoutQueue = emptyList(),
                        history = listOf(entry) + it.history,
                    )
                }
                broadcast { summaryTvMessage(entry, it.theme) }
                onDone(false)
            }
        }
    }

    fun cancelSession() {
        viewModelScope.launch {
            repo.update {
                it.copy(activeSession = null, prep = null, workoutQueue = emptyList())
            }
            broadcast { idleTvMessage(it.theme) }
        }
    }

    fun deleteHistory(id: String) {
        viewModelScope.launch {
            repo.update { it.copy(history = it.history.filterNot { h -> h.id == id }) }
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
