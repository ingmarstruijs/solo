import { useCallback, useSyncExternalStore } from 'react'
import type { WorkoutTemplate } from '@/types/workout'
import {
  addWorkout,
  duplicateWorkout,
  exportWorkouts,
  getWorkouts,
  importWorkouts,
  removeWorkout,
  subscribeWorkouts,
  toggleFavorite,
  updateWorkout,
} from '@/lib/storage/workoutStore'

export function useWorkouts() {
  const workouts = useSyncExternalStore(subscribeWorkouts, getWorkouts, getWorkouts)

  const add = useCallback(
    (partial: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>) => addWorkout(partial),
    [],
  )
  const update = useCallback(
    (id: string, patch: Partial<WorkoutTemplate>) => updateWorkout(id, patch),
    [],
  )
  const remove = useCallback((id: string) => removeWorkout(id), [])
  const duplicate = useCallback((id: string) => duplicateWorkout(id), [])
  const toggleFav = useCallback((id: string) => toggleFavorite(id), [])
  const exportData = useCallback(() => exportWorkouts(), [])
  const importData = useCallback((json: string) => {
    const data = JSON.parse(json)
    return importWorkouts(data)
  }, [])

  return { workouts, add, update, remove, duplicate, toggleFav, exportData, importData }
}
