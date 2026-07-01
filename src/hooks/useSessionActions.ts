import { useSyncExternalStore } from 'react'
import type { ActiveSession } from '@/types/workout'
import type { SessionSummary } from '@/lib/workout/sessionSummary'
import { addSessionRecord } from '@/lib/storage/historyStore'
import {
  clearActiveSession,
  getActiveSession,
  saveActiveSession,
  setExerciseNote,
  startSessionExercises,
  subscribeActiveSession,
  toggleExerciseComplete,
  toggleExercisePause,
} from '@/lib/storage/sessionStore'
import { loadWorkoutQueue, type PreparedWorkout } from '@/lib/workout/sessionPrep'
import { getPhaseInfo } from '@/lib/workout/workoutStructure'

export type SessionEndResult = 'next-workout' | 'done'

/** Een sessie telt als voltooid als alle oefeningen in de laatste set/ronde afgevinkt zijn. */
function isSessionComplete(session: ActiveSession): boolean {
  const phase = getPhaseInfo(session.workout)
  const allDone =
    session.completedExerciseIds.length === session.workout.exercises.length
  const isLastPhase = session.currentSet >= phase.total
  return allDone && isLastPhase
}

export function useSessionActions() {
  const session = useSyncExternalStore(subscribeActiveSession, getActiveSession, getActiveSession)

  return {
    session,
    toggleComplete: toggleExerciseComplete,
    setNote: setExerciseNote,
    startExercises: startSessionExercises,
    togglePause: toggleExercisePause,
    /** Sessie afbreken zonder op te slaan in geschiedenis. */
    cancelSession: () => {
      clearActiveSession()
    },
    /**
     * Workout afronden. Alleen een daadwerkelijk voltooide sessie (alle oefeningen
     * in de laatste set afgevinkt) wordt in de historie opgeslagen; vroegtijdig
     * stoppen komt niet in de historie.
     */
    completeSession: (summary: SessionSummary): SessionEndResult => {
      if (!session) return 'done'

      const queue = loadWorkoutQueue()

      if (isSessionComplete(session)) {
        addSessionRecord({
          workoutName: summary.workoutName,
          workoutIds: [session.workout.id],
          exerciseCount: session.workout.exercises.length,
          durationMinutes: Math.max(1, Math.round(summary.totalDurationSeconds / 60)),
          completedAt: summary.completedAt,
          summary,
        })
      }

      clearActiveSession({ keepQueue: true })
      return queue.length > 0 ? 'next-workout' : 'done'
    },
    startNextWorkout: (next: PreparedWorkout) => {
      startPreparedWorkout(next)
    },
  }
}

function startPreparedWorkout(next: PreparedWorkout): void {
  const now = new Date().toISOString()
  const active: ActiveSession = {
    workout: next.workout,
    targets: next.targets,
    completedExerciseIds: [],
    exerciseNotes: {},
    currentSet: 1,
    startedAt: now,
    currentSetStartedAt: now,
    exercisesStarted: false,
    pausedExerciseIds: [],
  }
  saveActiveSession(active)
}
