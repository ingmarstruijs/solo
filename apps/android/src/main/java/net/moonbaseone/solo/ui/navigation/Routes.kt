package net.moonbaseone.solo.ui.navigation

object Routes {
    const val HOME = "home"
    const val WORKOUTS = "workouts"
    const val LOCKER = "locker"
    const val HISTORY = "history"
    const val SETTINGS = "settings"
    const val PREP = "prep"
    const val SESSION = "session"
    const val SUMMARY = "summary"
    const val PAIR = "pair"
}

val bottomDestinations =
    listOf(
        Routes.HOME,
        Routes.WORKOUTS,
        Routes.LOCKER,
        Routes.HISTORY,
        Routes.SETTINGS,
    )
