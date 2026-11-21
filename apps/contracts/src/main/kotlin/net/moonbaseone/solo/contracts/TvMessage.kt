package net.moonbaseone.solo.contracts

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** Current wire schema; bump on breaking TvMessage changes. */
const val TV_SCHEMA_VERSION: Int = 1

@Serializable
data class TvSensorState(
    val cameraEnabled: Boolean,
    val garminConnected: Boolean,
    val heartRateLive: Boolean,
    val heartRateBpm: Int? = null,
    val velocityDropPercent: Double = 0.0,
    val heartRatePercentMax: Double = 0.0,
)

@Serializable
data class TvRestState(
    val active: Boolean,
    val endsAt: String? = null,
    val totalSeconds: Int = 0,
    val afterExerciseName: String? = null,
    val kind: String? = null,
    val phaseLabel: String? = null,
    val completedPhase: Int? = null,
    val nextExerciseName: String? = null,
    val nextExerciseTarget: String? = null,
)

@Serializable
data class TvPrepWorkout(
    val id: String,
    val name: String,
    val exerciseCount: Int,
)

@Serializable
data class TvSetupMaterial(
    val id: String,
    val category: String,
    val label: String,
)

@Serializable
data class TvSummaryExercise(
    val name: String,
    val metric: String,
    val durationSeconds: Int,
    val durationsBySet: List<Int>,
    val avgPerSet: Double,
    val trend: String,
    val trendPercent: Double,
)

@Serializable
data class TvSummarySetExercise(
    val name: String,
    val durationSeconds: Int,
)

@Serializable
data class TvSummarySet(
    val setNumber: Int,
    val label: String,
    val durationSeconds: Int,
    val exercises: List<TvSummarySetExercise>,
    val rpe: Double? = null,
)

@Serializable
data class TvSummarySetMark(
    val setNumber: Int,
    val seconds: Int,
)

@Serializable
data class TvSummaryExerciseMark(
    val name: String,
    val avgSeconds: Double,
)

@Serializable
data class TvSummaryStats(
    val phaseLabel: String,
    val totalSets: Int,
    val totalExercisesCompleted: Int,
    val avgSetDurationSeconds: Double,
    val avgExercisePerSetSeconds: Double,
    val fastestSet: TvSummarySetMark? = null,
    val slowestSet: TvSummarySetMark? = null,
    val fastestExercise: TvSummaryExerciseMark? = null,
    val slowestExercise: TvSummaryExerciseMark? = null,
    val paceChangePercent: Double,
    val paceLabel: String,
    val avgRpe: Double? = null,
)

/**
 * Phone → TV HUD message. Polymorphic on JSON field `mode`
 * (`Json` configured with `classDiscriminator = "mode"`).
 */
@Serializable
sealed interface TvMessage {
    val schemaVersion: Int
    val theme: String
    val updatedAt: String

    @Serializable
    @SerialName("idle")
    data class Idle(
        override val schemaVersion: Int = TV_SCHEMA_VERSION,
        override val theme: String,
        override val updatedAt: String,
    ) : TvMessage

    @Serializable
    @SerialName("prep")
    data class Prep(
        override val schemaVersion: Int = TV_SCHEMA_VERSION,
        override val theme: String,
        val workouts: List<TvPrepWorkout>,
        val garminConnected: Boolean,
        val recoveryScore: Double? = null,
        override val updatedAt: String,
    ) : TvMessage

    @Serializable
    @SerialName("setup")
    data class Setup(
        override val schemaVersion: Int = TV_SCHEMA_VERSION,
        override val theme: String,
        val workoutName: String,
        val exerciseCount: Int,
        val materials: List<TvSetupMaterial>,
        val garminConnected: Boolean,
        val recoveryScore: Double? = null,
        override val updatedAt: String,
    ) : TvMessage

    @Serializable
    @SerialName("session")
    data class Session(
        override val schemaVersion: Int = TV_SCHEMA_VERSION,
        override val theme: String,
        val connected: Boolean,
        val workoutName: String,
        val exerciseIndex: Int,
        val exerciseName: String,
        val exerciseKind: String? = null,
        val metric: String? = null,
        val equipment: List<String>? = null,
        val icon: String? = null,
        val exerciseDescription: String? = null,
        val nextExerciseName: String? = null,
        val completedCount: Int,
        val totalExercises: Int,
        val setIndex: Int,
        val totalSets: Int,
        val phaseLabel: String,
        val progressPercent: Double,
        val completedSlots: Int,
        val totalSlots: Int,
        val targetLabel: String,
        val weightKg: Double? = null,
        val recoveryScore: Double? = null,
        val sensor: TvSensorState,
        val coachEnabled: Boolean,
        val rest: TvRestState,
        val exerciseStartedAt: String? = null,
        val exerciseTimerActive: Boolean? = null,
        override val updatedAt: String,
    ) : TvMessage

    @Serializable
    @SerialName("summary")
    data class Summary(
        override val schemaVersion: Int = TV_SCHEMA_VERSION,
        override val theme: String,
        override val updatedAt: String,
        val workoutName: String,
        val exercises: List<TvSummaryExercise>,
        val sets: List<TvSummarySet>,
        val stats: TvSummaryStats,
        val rpeBySet: Map<String, Double> = emptyMap(),
        val totalDurationSeconds: Int,
        val startedAt: String,
        val completedAt: String,
        val aiReport: String? = null,
        val aiReportModel: String? = null,
        val aiReportAt: String? = null,
        val momentIds: List<String>? = null,
    ) : TvMessage
}

/** Wire `mode` discriminator (mirrors `@SerialName` / JSON `mode`). */
val TvMessage.mode: String
    get() =
        when (this) {
            is TvMessage.Idle -> "idle"
            is TvMessage.Prep -> "prep"
            is TvMessage.Setup -> "setup"
            is TvMessage.Session -> "session"
            is TvMessage.Summary -> "summary"
        }
