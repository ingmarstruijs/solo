package net.moonbaseone.solo.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import net.moonbaseone.solo.SoloViewModel
import net.moonbaseone.solo.ui.navigation.Routes
import net.moonbaseone.solo.ui.navigation.bottomDestinations
import net.moonbaseone.solo.ui.screens.HistoryScreen
import net.moonbaseone.solo.ui.screens.HomeScreen
import net.moonbaseone.solo.ui.screens.LockerScreen
import net.moonbaseone.solo.ui.screens.PairScreen
import net.moonbaseone.solo.ui.screens.PrepScreen
import net.moonbaseone.solo.ui.screens.SessionScreen
import net.moonbaseone.solo.ui.screens.SettingsScreen
import net.moonbaseone.solo.ui.screens.SummaryScreen
import net.moonbaseone.solo.ui.screens.WorkoutsScreen

@Composable
fun SoloApp(
    viewModel: SoloViewModel,
    onStartFakeHr: () -> Unit,
    onStartRealHr: () -> Unit,
    onStopHr: () -> Unit,
) {
    val navController = rememberNavController()
    val snap by viewModel.snapshot.collectAsStateWithLifecycle()
    val pairing by viewModel.pairingState.collectAsStateWithLifecycle()
    val hrState by viewModel.hrState.collectAsStateWithLifecycle()
    val hrSource by viewModel.hrSource.collectAsStateWithLifecycle()
    val backStack by navController.currentBackStackEntryAsState()
    val route = backStack?.destination?.route
    val showBottom = route in bottomDestinations
    var didRestoreNav by remember { mutableStateOf(false) }

    LaunchedEffect(snap.activeSession, snap.seeded) {
        if (!didRestoreNav && snap.seeded && snap.activeSession != null) {
            didRestoreNav = true
            navController.navigate(Routes.SESSION) {
                launchSingleTop = true
            }
        }
    }

    Scaffold(
        bottomBar = {
            if (showBottom) {
                NavigationBar(modifier = Modifier.testTag("bottom_nav")) {
                    bottomDestinations.forEach { dest ->
                        NavigationBarItem(
                            selected = route == dest,
                            onClick = {
                                navController.navigate(dest) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Text(navLabel(dest).take(1)) },
                            label = { Text(navLabel(dest)) },
                            modifier = Modifier.testTag("nav_$dest"),
                        )
                    }
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = Routes.HOME,
            modifier = Modifier.padding(padding),
        ) {
            composable(Routes.HOME) {
                HomeScreen(
                    snapshot = snap,
                    onOpenWorkouts = { navController.navigate(Routes.WORKOUTS) },
                    onResumeSession = { navController.navigate(Routes.SESSION) },
                    onOpenPrep = { navController.navigate(Routes.PREP) },
                )
            }
            composable(Routes.WORKOUTS) {
                WorkoutsScreen(
                    snapshot = snap,
                    onPrepare = { ids ->
                        viewModel.prepareSelected(ids)
                        navController.navigate(Routes.PREP)
                    },
                )
            }
            composable(Routes.LOCKER) {
                LockerScreen(snapshot = snap)
            }
            composable(Routes.HISTORY) {
                HistoryScreen(
                    snapshot = snap,
                    onOpenSummary = { navController.navigate(Routes.SUMMARY) },
                )
            }
            composable(Routes.SETTINGS) {
                SettingsScreen(
                    snapshot = snap,
                    hrState = hrState,
                    hrSource = hrSource,
                    pairing = pairing,
                    onRecovery = viewModel::setRecovery,
                    onOpenPair = { navController.navigate(Routes.PAIR) },
                    onStartFakeHr = onStartFakeHr,
                    onStartRealHr = onStartRealHr,
                    onStopHr = onStopHr,
                )
            }
            composable(Routes.PREP) {
                PrepScreen(
                    snapshot = snap,
                    onStart = {
                        viewModel.startFromPrep()
                        navController.navigate(Routes.SESSION) {
                            popUpTo(Routes.HOME)
                        }
                    },
                    onBack = { navController.popBackStack() },
                    onOpenPair = { navController.navigate(Routes.PAIR) },
                )
            }
            composable(Routes.SESSION) {
                SessionScreen(
                    snapshot = snap,
                    hrState = hrState,
                    onBegin = viewModel::beginExercises,
                    onComplete = viewModel::markExerciseDone,
                    onSkipRest = viewModel::skipRestNow,
                    onFinish = {
                        viewModel.finishWorkout()
                        navController.navigate(Routes.SUMMARY) {
                            popUpTo(Routes.HOME)
                        }
                    },
                    onCancel = {
                        viewModel.cancelSession()
                        navController.navigate(Routes.HOME) {
                            popUpTo(Routes.HOME) { inclusive = true }
                        }
                    },
                    onOpenPair = { navController.navigate(Routes.PAIR) },
                )
            }
            composable(Routes.SUMMARY) {
                SummaryScreen(
                    snapshot = snap,
                    onDone = {
                        navController.navigate(Routes.HOME) {
                            popUpTo(Routes.HOME) { inclusive = true }
                        }
                    },
                )
            }
            composable(Routes.PAIR) {
                PairScreen(
                    pairing = pairing,
                    onConnect = viewModel::connectTv,
                    onDisconnect = viewModel::disconnectTv,
                    onBack = { navController.popBackStack() },
                )
            }
        }
    }
}

private fun navLabel(route: String): String =
    when (route) {
        Routes.HOME -> "Home"
        Routes.WORKOUTS -> "Workouts"
        Routes.LOCKER -> "Locker"
        Routes.HISTORY -> "History"
        Routes.SETTINGS -> "Settings"
        else -> route
    }
