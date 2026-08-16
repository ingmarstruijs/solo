import { useEffect, useState } from 'react'
import type { WorkoutExercise } from '@/types/workout'
import { useLocale } from '@/i18n/hooks'
import {
  ensureLocalizedExercise,
  getExerciseDescription,
  getExerciseDisplayName,
} from '@/lib/exercise/localizeExercise'

/** Resolve exercise name/description for the active app locale (re-fetches / MT when needed). */
export function useLocalizedExercise(exercise: WorkoutExercise) {
  const { locale } = useLocale()
  const [resolved, setResolved] = useState(exercise)

  useEffect(() => {
    let cancelled = false
    setResolved(exercise)

    void ensureLocalizedExercise(exercise, locale).then((next) => {
      if (!cancelled) setResolved(next)
    })

    return () => {
      cancelled = true
    }
  }, [exercise, locale])

  return {
    exercise: resolved,
    name: getExerciseDisplayName(resolved, locale),
    description: getExerciseDescription(resolved, locale),
    locale,
  }
}
