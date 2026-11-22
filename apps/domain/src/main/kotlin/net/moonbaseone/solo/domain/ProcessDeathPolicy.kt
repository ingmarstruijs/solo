package net.moonbaseone.solo.domain

/**
 * Process-death / cold-start recovery for phone sessions.
 *
 * Policy:
 * 1. Persist [net.moonbaseone.solo.domain.model.ActiveSession] whenever it changes
 *    (DataStore JSON snapshot on Android).
 * 2. On app start, if a persisted session exists, restore it and resume UI at Session
 *    (or Setup if `exercisesStarted == false`).
 * 3. Rest timers: if `restEndsAt` is in the past on restore, clear rest and continue;
 *    if still in the future, keep the countdown.
 * 4. Clearing history or finishing a workout clears the active session.
 * 5. Prep is also persisted so leaving Prep and returning does not lose selection.
 */
object ProcessDeathPolicy {
    const val VERSION: Int = 1
}
