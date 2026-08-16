import type { EquipmentCategory } from '@/types/locker'
import type { ExerciseMedia, WorkoutExercise } from '@/types/workout'
import type { WgerExerciseImage, WgerExerciseInfo } from '@/types/wger'
import { getAppLocale } from '@/i18n'
import type { AppLocale } from '@/i18n/registry'
import { wgerIdForLocale } from '@/i18n/registry'
import { createId } from '@/lib/storage/localStore'
import { getAutoTranslateWger } from '@/lib/storage/translateStore'
import { translateMarkdown } from '@/lib/translate/client'
import { descriptionPriorityForLocale, wgerLanguageCode } from '@/lib/translate/wgerLanguages'
import { recalcWorkoutDuration } from '@/lib/workout/overloadPlanner'
import type { WorkoutTemplate } from '@/types/workout'
import { i18n } from '@/i18n'
import { exerciseDisplayName, htmlToMarkdown, stripHtml } from './client'
import { mapWgerEquipment } from './mapEquipment'
import { pickWgerTranslation } from './pickTranslation'

function pickWgerImage(images: WgerExerciseImage[] | undefined): WgerExerciseImage | undefined {
  if (!images?.length) return undefined
  return images.find((img) => img.is_main) ?? images[0]
}

function wgerImageToMedia(image: WgerExerciseImage): ExerciseMedia {
  return {
    thumbnailUrl: image.thumbnails?.medium ?? image.thumbnails?.small,
    imageUrl: image.image,
    attribution: image.license_author || undefined,
    source: 'wger',
  }
}

function collectNameByLocale(info: WgerExerciseInfo): Partial<Record<AppLocale, string>> {
  const names: Partial<Record<AppLocale, string>> = {}
  for (const locale of ['en', 'nl', 'de', 'fr'] as AppLocale[]) {
    const id = wgerIdForLocale(locale)
    const hit = info.translations.find((t) => t.language === id && t.name.trim())
    if (hit) names[locale] = hit.name.trim()
  }
  return names
}

export async function wgerExerciseToWorkoutExercise(
  info: WgerExerciseInfo,
  language?: number,
  targetLocale: AppLocale = getAppLocale(),
): Promise<WorkoutExercise> {
  const equipment = mapWgerEquipment(info.equipment)
  const pickedImage = pickWgerImage(info.images)
  const media = pickedImage ? wgerImageToMedia(pickedImage) : undefined

  const preferredLanguages = language
    ? [language, ...descriptionPriorityForLocale(targetLocale).filter((id) => id !== language)]
    : descriptionPriorityForLocale(targetLocale)

  const translation = pickWgerTranslation(info.translations, preferredLanguages)
  const rawDescription = translation?.description ?? ''
  const sourceMarkdown = htmlToMarkdown(rawDescription) || undefined
  const sourceLang = translation ? wgerLanguageCode(translation.language) : undefined

  let description = sourceMarkdown
  const descriptionByLocale: Partial<Record<AppLocale, string>> = {}
  const nameByLocale = collectNameByLocale(info)

  if (sourceMarkdown && sourceLang) {
    const nativeLocale = (['en', 'nl', 'de', 'fr'] as AppLocale[]).find((l) => l === sourceLang)
    if (nativeLocale) descriptionByLocale[nativeLocale] = sourceMarkdown
  }

  if (description && getAutoTranslateWger() && sourceLang && sourceLang !== targetLocale) {
    try {
      description = await translateMarkdown(description, sourceLang, targetLocale)
      descriptionByLocale[targetLocale] = description
    } catch {
      // Keep original markdown when translation is unavailable.
    }
  } else if (description && sourceLang === targetLocale) {
    descriptionByLocale[targetLocale] = description
  }

  const preferredLangId = language ?? wgerIdForLocale(targetLocale)
  const displayName =
    nameByLocale[targetLocale] ?? exerciseDisplayName(info, preferredLangId)

  return {
    id: createId(),
    name: displayName,
    externalId: String(info.id),
    metric: 'reps',
    target: 10,
    weightKg: guessDefaultWeight(equipment),
    restSeconds: 75,
    equipment,
    media,
    description,
    descriptionByLocale: Object.keys(descriptionByLocale).length ? descriptionByLocale : undefined,
    sourceDescription: sourceMarkdown,
    sourceLang,
    nameByLocale: Object.keys(nameByLocale).length ? nameByLocale : undefined,
    notes: stripHtml(rawDescription).slice(0, 200) || undefined,
  }
}

function guessDefaultWeight(equipment: EquipmentCategory[]): number {
  if (equipment.includes('barbell')) return 40
  if (equipment.includes('dumbbell')) return 14
  if (equipment.includes('kettlebell')) return 16
  return 0
}

export function buildWorkoutFromWgerExercises(
  name: string,
  exercises: WorkoutExercise[],
  sets = 3,
): Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name,
    description: i18n.t('common:importedFromWger'),
    exercises,
    sets,
    restBetweenSets: 75,
    favorite: false,
    source: 'wger',
    estimatedMinutes: recalcWorkoutDuration(exercises, sets),
    tags: ['wger', 'imported'],
  }
}
