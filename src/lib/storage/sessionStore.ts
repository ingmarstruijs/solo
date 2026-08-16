import type { ActiveSession } from '@/types/workout'
import { readStore, subscribeStore, writeStore } from './localStore'

const KEY = 'solo-active-session'

export function getActiveSession(): ActiveSession | null {
  return readStore<ActiveSession | null>(KEY, null)
}

export function isSessionActive(): boolean {
  return getActiveSession() != null
}

export function saveActiveSession(session: ActiveSession): void {
  writeStore(KEY, session)
}

export function clearActiveSession(options?: { keepQueue?: boolean }): void {
  writeStore(KEY, null)
  sessionStorage.removeItem('solo-active-workout')
  sessionStorage.removeItem('solo-overload-targets')
  sessionStorage.removeItem('solo-session-prep')
  if (!options?.keepQueue) {
    sessionStorage.removeItem('solo-workout-queue')
  }
}

function recordSetWallDuration(session: ActiveSession): Record<number, number> {
  const start = session.currentSetStartedAt ?? session.startedAt
  const wall = Math.max(1, Math.floor((Date.now() - new Date(start).getTime()) / 1000))
  return { ...(session.setWallDurations ?? {}), [session.currentSet]: wall }
}

export function advanceToNextSet(): void {
  const session = getActiveSession()
  if (!session) return
  const now = new Date().toISOString()
  saveActiveSession({
    ...session,
    setWallDurations: recordSetWallDuration(session),
    currentSet: session.currentSet + 1,
    completedExerciseIds: [],
    currentExerciseStartedAt: now,
    currentSetStartedAt: now,
    lastExerciseDuration: {},
  })
}

export type ToggleExerciseCompleteOptions = {
  /** Wacht met starten van de volgende oefening-timer tot rust voorbij is. */
  deferNextExerciseStart?: boolean
  /** Geen duur bijhouden (bijv. reps-oefeningen). */
  skipDuration?: boolean
}

export function toggleExerciseComplete(
  exerciseId: string,
  options?: ToggleExerciseCompleteOptions,
): void {
  const session = getActiveSession()
  if (!session) return
  const done = new Set(session.completedExerciseIds)
  const wasDone = done.has(exerciseId)
  if (wasDone) done.delete(exerciseId)
  else done.add(exerciseId)

  const now = Date.now()
  const exercise = session.workout.exercises.find((e) => e.id === exerciseId)
  const tracksTime = exercise?.metric !== 'reps' && !options?.skipDuration
  const exerciseDurations = { ...(session.exerciseDurations ?? {}) }
  const lastExerciseDuration = { ...(session.lastExerciseDuration ?? {}) }
  const exerciseDurationsBySet = { ...(session.exerciseDurationsBySet ?? {}) }
  const setMap = { ...(exerciseDurationsBySet[session.currentSet] ?? {}) }

  if (wasDone) {
    const subtract = lastExerciseDuration[exerciseId] ?? 0
    if (subtract > 0) {
      exerciseDurations[exerciseId] = Math.max(0, (exerciseDurations[exerciseId] ?? 0) - subtract)
      if (setMap[exerciseId] != null) {
        setMap[exerciseId] = Math.max(0, setMap[exerciseId] - subtract)
        if (setMap[exerciseId] === 0) delete setMap[exerciseId]
      }
    }
    delete lastExerciseDuration[exerciseId]
  } else if (tracksTime) {
    const startedMs = new Date(session.currentExerciseStartedAt ?? session.startedAt).getTime()
    const duration = Math.max(1, Math.floor((now - startedMs) / 1000))
    lastExerciseDuration[exerciseId] = duration
    exerciseDurations[exerciseId] = (exerciseDurations[exerciseId] ?? 0) + duration
    setMap[exerciseId] = duration
  }

  exerciseDurationsBySet[session.currentSet] = setMap

  const patch: ActiveSession = {
    ...session,
    completedExerciseIds: [...done],
    exerciseDurations,
    exerciseDurationsBySet,
    lastExerciseDuration,
  }

  if (!options?.deferNextExerciseStart) {
    patch.currentExerciseStartedAt = new Date(now).toISOString()
  }

  saveActiveSession(patch)
}

/** Start de timer voor de huidige oefening (na rust of overslaan). */
export function startCurrentExerciseTimer(): void {
  const session = getActiveSession()
  if (!session?.exercisesStarted) return
  saveActiveSession({
    ...session,
    currentExerciseStartedAt: new Date().toISOString(),
  })
}

export function setExerciseNote(exerciseId: string, note: { audioNote?: string; audioNoteText?: string }): void {
  const session = getActiveSession()
  if (!session) return
  saveActiveSession({
    ...session,
    exerciseNotes: { ...session.exerciseNotes, [exerciseId]: note },
  })
}

/** Persist or clear RPE (1–10) for a completed set/round. */
export function setSessionRpe(setNumber: number, rpe: number | null): void {
  const session = getActiveSession()
  if (!session || setNumber < 1) return
  const rpeBySet = { ...(session.rpeBySet ?? {}) }
  if (rpe == null) {
    delete rpeBySet[setNumber]
  } else {
    rpeBySet[setNumber] = Math.min(10, Math.max(1, Math.round(rpe)))
  }
  saveActiveSession({ ...session, rpeBySet })
}

export function startSessionExercises(): void {
  const session = getActiveSession()
  if (!session || session.exercisesStarted) return
  const now = new Date().toISOString()
  saveActiveSession({
    ...session,
    exercisesStarted: true,
    currentExerciseStartedAt: now,
    pausedExerciseIds: [],
  })
}

export function toggleExercisePause(exerciseId: string): void {
  const session = getActiveSession()
  if (!session || !session.exercisesStarted) return
  const paused = new Set(session.pausedExerciseIds ?? [])
  if (paused.has(exerciseId)) {
    paused.delete(exerciseId)
    saveActiveSession({
      ...session,
      pausedExerciseIds: [...paused],
      currentExerciseStartedAt: new Date().toISOString(),
    })
    return
  }
  paused.add(exerciseId)
  saveActiveSession({
    ...session,
    pausedExerciseIds: [...paused],
  })
}

export function subscribeActiveSession(onChange: () => void): () => void {
  return subscribeStore(KEY, onChange)
}
