package net.moonbaseone.solo.ui.navigation

object Routes {
    const val HOME = "home"
    const val WORKOUTS = "workouts"
    const val WORKOUT_NEW = "workouts/new"
    const val WORKOUT_EDIT = "workouts/{workoutId}/edit"
    const val LOCKER = "locker"
    const val HISTORY = "history"
    const val SETTINGS = "settings"
    const val PREP = "prep"
    const val SESSION = "session"
    const val SUMMARY = "summary"
    const val PAIR = "pair"

    fun workoutEdit(id: String) = "workouts/$id/edit"
}

val bottomDestinations =
    listOf(
        Routes.HOME,
        Routes.WORKOUTS,
        Routes.LOCKER,
        Routes.HISTORY,
        Routes.SETTINGS,
    )
