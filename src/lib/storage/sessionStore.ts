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

export function toggleExerciseComplete(exerciseId: string): void {
  const session = getActiveSession()
  if (!session) return
  const done = new Set(session.completedExerciseIds)
  const wasDone = done.has(exerciseId)
  if (wasDone) done.delete(exerciseId)
  else done.add(exerciseId)

  const now = Date.now()
  const startedMs = new Date(session.currentExerciseStartedAt ?? session.startedAt).getTime()
  const duration = Math.max(1, Math.floor((now - startedMs) / 1000))
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
  } else {
    lastExerciseDuration[exerciseId] = duration
    exerciseDurations[exerciseId] = (exerciseDurations[exerciseId] ?? 0) + duration
    setMap[exerciseId] = duration
  }

  exerciseDurationsBySet[session.currentSet] = setMap

  saveActiveSession({
    ...session,
    completedExerciseIds: [...done],
    currentExerciseStartedAt: new Date(now).toISOString(),
    exerciseDurations,
    exerciseDurationsBySet,
    lastExerciseDuration,
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
