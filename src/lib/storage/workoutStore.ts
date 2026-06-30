import type { WorkoutExport, WorkoutTemplate } from '@/types/workout'
import { SEED_WORKOUTS } from '@/data/seedWorkouts'
import { migrateWorkout, type LegacyWorkout } from '@/lib/workout/migrateWorkout'
import { createId, readStore, subscribeStore, writeStore } from './localStore'

const KEY = 'solo-workouts'
const SEEDED_KEY = 'solo-workouts-seeded'

function hasSeeded(): boolean {
  try {
    return localStorage.getItem(SEEDED_KEY) === '1'
  } catch {
    return false
  }
}

function markSeeded(): void {
  try {
    localStorage.setItem(SEEDED_KEY, '1')
  } catch {
    // ignore
  }
}

function ensureSeed(): WorkoutTemplate[] {
  const existing = readStore<LegacyWorkout[]>(KEY, [])
  if (existing.length === 0) {
    // Only seed the example workouts once. After the user has deleted them all,
    // the seeded marker prevents them from reappearing.
    if (hasSeeded()) return readStore<WorkoutTemplate[]>(KEY, [])
    writeStore(KEY, SEED_WORKOUTS)
    markSeeded()
    // Re-read so we return the cached (stable) reference rather than the seed constant.
    return readStore<WorkoutTemplate[]>(KEY, [])
  }

  markSeeded()

  // Migrate legacy workouts (sets/audio per exercise) once and persist so the
  // snapshot reference stays stable for useSyncExternalStore.
  const needsMigration = existing.some(
    (w) =>
      typeof w.sets !== 'number' ||
      typeof w.restBetweenSets !== 'number' ||
      w.exercises.some((e) => 'sets' in e || 'audioNote' in e || 'audioNoteText' in e) ||
      (w.tags.includes('circuit') && (w.circuitRounds ?? 1) <= 1 && (w.sets ?? 1) > 1),
  )
  if (needsMigration) {
    const migrated = existing
      .map(migrateWorkout)
      .map((w) =>
        w.tags.includes('circuit') && (w.circuitRounds ?? 1) <= 1 && w.sets > 1
          ? {
              ...w,
              circuitRounds: w.sets,
              sets: 1,
              restBetweenRounds: w.restBetweenSets,
              restBetweenSets: 0,
            }
          : w,
      )
    writeStore(KEY, migrated)
  }
  return readStore<WorkoutTemplate[]>(KEY, [])
}

export function getWorkouts(): WorkoutTemplate[] {
  return ensureSeed()
}

export function getWorkout(id: string): WorkoutTemplate | undefined {
  return getWorkouts().find((w) => w.id === id)
}

export function saveWorkouts(workouts: WorkoutTemplate[]): void {
  writeStore(KEY, workouts)
}

export function addWorkout(
  partial: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>,
): WorkoutTemplate {
  const now = new Date().toISOString()
  const workout: WorkoutTemplate = { ...partial, id: createId(), createdAt: now, updatedAt: now }
  saveWorkouts([...getWorkouts(), workout])
  return workout
}

export function updateWorkout(id: string, patch: Partial<WorkoutTemplate>): WorkoutTemplate | null {
  const workouts = getWorkouts()
  const idx = workouts.findIndex((w) => w.id === id)
  if (idx === -1) return null
  const updated = { ...workouts[idx], ...patch, updatedAt: new Date().toISOString() }
  workouts[idx] = updated
  saveWorkouts(workouts)
  return updated
}

export function removeWorkout(id: string): void {
  saveWorkouts(getWorkouts().filter((w) => w.id !== id))
}

export function toggleFavorite(id: string): void {
  const workout = getWorkout(id)
  if (workout) updateWorkout(id, { favorite: !workout.favorite })
}

export function exportWorkouts(): WorkoutExport {
  return { version: 1, exportedAt: new Date().toISOString(), workouts: getWorkouts() }
}

export function importWorkouts(data: WorkoutExport): number {
  const existing = getWorkouts()
  const merged = [...existing]
  let added = 0
  for (const workout of data.workouts) {
    if (!merged.some((e) => e.id === workout.id)) {
      merged.push(workout)
      added++
    }
  }
  saveWorkouts(merged)
  return added
}

/** Import a shared workout with fresh ids so it never collides with existing data. */
export function importSharedWorkout(workout: WorkoutTemplate): WorkoutTemplate {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = workout
  return addWorkout({
    ...rest,
    favorite: false,
    exercises: rest.exercises.map((ex) => ({ ...ex, id: createId() })),
  })
}

export function subscribeWorkouts(onChange: () => void): () => void {
  return subscribeStore(KEY, onChange)
}
