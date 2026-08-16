import type { LocalizedText } from '@/i18n/types'
import type { AppLocale } from '@/i18n/registry'
import { APP_LOCALE_CODES, isAppLocale, wgerIdForLocale } from '@/i18n/registry'
import { getAppLocale } from '@/i18n'
import type { WorkoutExercise } from '@/types/workout'
import { getAutoTranslateWger } from '@/lib/storage/translateStore'
import { getWorkouts, saveWorkouts } from '@/lib/storage/workoutStore'
import { translateMarkdown } from '@/lib/translate/client'
import { descriptionPriorityForLocale, wgerLanguageCode } from '@/lib/translate/wgerLanguages'
import { getExercise, htmlToMarkdown } from '@/lib/wger/client'
import { pickWgerTranslation } from '@/lib/wger/pickTranslation'

function mergeLocalized(
  existing: LocalizedText | undefined,
  locale: AppLocale,
  text: string,
): LocalizedText {
  return { ...existing, [locale]: text }
}

/** Best available description for a locale without network. */
export function getExerciseDescription(
  exercise: WorkoutExercise,
  locale: AppLocale = getAppLocale(),
): string | undefined {
  const byLocale = exercise.descriptionByLocale?.[locale]
  if (byLocale?.trim()) return byLocale

  if (exercise.sourceLang === locale && exercise.sourceDescription?.trim()) {
    return exercise.sourceDescription
  }

  if (exercise.description?.trim()) return exercise.description

  for (const code of APP_LOCALE_CODES) {
    const text = exercise.descriptionByLocale?.[code]
    if (text?.trim()) return text
  }

  return exercise.sourceDescription?.trim() || undefined
}

export function getExerciseDisplayName(
  exercise: WorkoutExercise,
  locale: AppLocale = getAppLocale(),
): string {
  return exercise.nameByLocale?.[locale] ?? exercise.name
}

/**
 * Ensure the exercise has text for `locale`. Uses cached locale map, Wger re-fetch,
 * or machine translation from `sourceDescription`. Persists into workout templates
 * when a matching exercise id / externalId is found.
 */
export async function ensureLocalizedExercise(
  exercise: WorkoutExercise,
  locale: AppLocale = getAppLocale(),
): Promise<WorkoutExercise> {
  if (exercise.descriptionByLocale?.[locale]?.trim()) {
    const text = exercise.descriptionByLocale[locale]!
    const name = getExerciseDisplayName(exercise, locale)
    if (exercise.description === text && exercise.name === name) return exercise
    return { ...exercise, description: text, name }
  }

  let next: WorkoutExercise = {
    ...exercise,
    name: getExerciseDisplayName(exercise, locale),
  }

  if (exercise.externalId) {
    try {
      const info = await getExercise(Number(exercise.externalId), wgerIdForLocale(locale))
      const translation = pickWgerTranslation(
        info.translations,
        descriptionPriorityForLocale(locale),
      )
      if (translation?.description.trim()) {
        const markdown = htmlToMarkdown(translation.description)
        const sourceLang = wgerLanguageCode(translation.language)
        const nameHit = info.translations.find((t) => t.language === wgerIdForLocale(locale))?.name

        next = {
          ...next,
          sourceDescription: next.sourceDescription ?? markdown,
          sourceLang: next.sourceLang ?? sourceLang,
          nameByLocale: nameHit
            ? { ...next.nameByLocale, [locale]: nameHit }
            : next.nameByLocale,
          name: nameHit ?? next.name,
        }

        if (isAppLocale(sourceLang)) {
          next = {
            ...next,
            descriptionByLocale: mergeLocalized(next.descriptionByLocale, sourceLang, markdown),
          }
        }

        if (sourceLang === locale) {
          next = {
            ...next,
            descriptionByLocale: mergeLocalized(next.descriptionByLocale, locale, markdown),
            description: markdown,
          }
        } else if (getAutoTranslateWger()) {
          try {
            const translated = await translateMarkdown(markdown, sourceLang, locale)
            next = {
              ...next,
              descriptionByLocale: mergeLocalized(next.descriptionByLocale, locale, translated),
              description: translated,
            }
          } catch {
            next = { ...next, description: getExerciseDescription(next, locale) ?? markdown }
          }
        } else {
          next = { ...next, description: getExerciseDescription(next, locale) ?? markdown }
        }

        persistExerciseLocalization(next)
        return next
      }
    } catch {
      // Fall through to source MT / legacy description.
    }
  }

  if (
    next.sourceDescription?.trim() &&
    next.sourceLang &&
    next.sourceLang !== locale &&
    getAutoTranslateWger()
  ) {
    try {
      const translated = await translateMarkdown(next.sourceDescription, next.sourceLang, locale)
      next = {
        ...next,
        descriptionByLocale: mergeLocalized(next.descriptionByLocale, locale, translated),
        description: translated,
      }
      persistExerciseLocalization(next)
      return next
    } catch {
      // keep fallback
    }
  }

  if (next.sourceDescription?.trim() && next.sourceLang === locale) {
    next = {
      ...next,
      descriptionByLocale: mergeLocalized(next.descriptionByLocale, locale, next.sourceDescription),
      description: next.sourceDescription,
    }
    persistExerciseLocalization(next)
    return next
  }

  if (next.description?.trim()) {
    next = {
      ...next,
      descriptionByLocale: mergeLocalized(next.descriptionByLocale, locale, next.description),
    }
    persistExerciseLocalization(next)
  }

  return next
}

/** Write localization fields back into any saved workout that contains this exercise. */
export function persistExerciseLocalization(exercise: WorkoutExercise): void {
  const workouts = getWorkouts()
  let changed = false
  const locale = getAppLocale()

  const updated = workouts.map((workout) => {
    let workoutChanged = false
    const exercises = workout.exercises.map((ex) => {
      const same =
        ex.id === exercise.id ||
        (exercise.externalId != null &&
          ex.externalId != null &&
          ex.externalId === exercise.externalId)
      if (!same) return ex
      workoutChanged = true
      return {
        ...ex,
        description: exercise.description ?? ex.description,
        descriptionByLocale: {
          ...ex.descriptionByLocale,
          ...exercise.descriptionByLocale,
        },
        sourceDescription: exercise.sourceDescription ?? ex.sourceDescription,
        sourceLang: exercise.sourceLang ?? ex.sourceLang,
        nameByLocale: {
          ...ex.nameByLocale,
          ...exercise.nameByLocale,
        },
        name: exercise.nameByLocale?.[locale] ?? exercise.name ?? ex.name,
      }
    })
    if (!workoutChanged) return workout
    changed = true
    return { ...workout, exercises, updatedAt: new Date().toISOString() }
  })

  if (changed) saveWorkouts(updated)
}
