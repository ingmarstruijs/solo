import type { LockerItem } from '@/types/locker'
import type { OverloadTarget, WorkoutTemplate } from '@/types/workout'
import { saveActiveSession } from '@/lib/storage/sessionStore'
import { getWorkout } from '@/lib/storage/workoutStore'
import { planOverloadTargets } from './overloadPlanner'

export type PreparedWorkout = {
  workout: WorkoutTemplate
  targets: OverloadTarget[]
}

export type SessionPrep = {
  workouts: PreparedWorkout[]
  recoveryScore: number
  createdAt: string
}

const PREP_KEY = 'solo-session-prep'

export function prepareWorkouts(
  ids: string[],
  lockerItems: LockerItem[],
  recoveryScore: number,
): SessionPrep | null {
  const workouts = ids.map((id) => getWorkout(id)).filter((w): w is WorkoutTemplate => w != null)
  if (workouts.length === 0) return null

  return {
    workouts: workouts.map((workout) => ({
      workout,
      targets: planOverloadTargets(workout, lockerItems, recoveryScore),
    })),
    recoveryScore,
    createdAt: new Date().toISOString(),
  }
}

export function saveSessionPrep(prep: SessionPrep): void {
  sessionStorage.setItem(PREP_KEY, JSON.stringify(prep))
}

export function loadSessionPrep(): SessionPrep | null {
  try {
    const raw = sessionStorage.getItem(PREP_KEY)
    return raw ? (JSON.parse(raw) as SessionPrep) : null
  } catch {
    return null
  }
}

export function activateSessionPrep(prep: SessionPrep): void {
  saveSessionPrep(prep)
  const first = prep.workouts[0]
  if (!first) return
  const now = new Date().toISOString()
  saveActiveSession({
    workout: first.workout,
    targets: first.targets,
    completedExerciseIds: [],
    exerciseNotes: {},
    currentSet: 1,
    startedAt: now,
    currentSetStartedAt: now,
    exercisesStarted: false,
    pausedExerciseIds: [],
  })
  sessionStorage.setItem('solo-workout-queue', JSON.stringify(prep.workouts.slice(1)))
}

export function loadWorkoutQueue(): PreparedWorkout[] {
  try {
    const raw = sessionStorage.getItem('solo-workout-queue')
    return raw ? (JSON.parse(raw) as PreparedWorkout[]) : []
  } catch {
    return []
  }
}

export function popNextQueuedWorkout(): PreparedWorkout | null {
  const queue = loadWorkoutQueue()
  if (queue.length === 0) return null
  const [next, ...rest] = queue
  sessionStorage.setItem('solo-workout-queue', JSON.stringify(rest))
  return next
}
