import type { EquipmentCategory } from '@/types/locker'
import type { ExerciseMedia, WorkoutExercise } from '@/types/workout'
import type { WgerExerciseImage, WgerExerciseInfo } from '@/types/wger'
import { createId } from '@/lib/storage/localStore'
import { getAutoTranslateWger } from '@/lib/storage/translateStore'
import { translateMarkdownToDutch } from '@/lib/translate/client'
import { wgerLanguageCode, WGER_DESCRIPTION_PRIORITY } from '@/lib/translate/wgerLanguages'
import { recalcWorkoutDuration } from '@/lib/workout/overloadPlanner'
import type { WorkoutTemplate } from '@/types/workout'
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

export async function wgerExerciseToWorkoutExercise(
  info: WgerExerciseInfo,
  language?: number,
): Promise<WorkoutExercise> {
  const equipment = mapWgerEquipment(info.equipment)
  const pickedImage = pickWgerImage(info.images)
  const media = pickedImage ? wgerImageToMedia(pickedImage) : undefined

  const preferredLanguages = language
    ? [language, ...WGER_DESCRIPTION_PRIORITY.filter((id) => id !== language)]
    : undefined
  const translation = pickWgerTranslation(info.translations, preferredLanguages)
  const rawDescription = translation?.description ?? ''
  let description = htmlToMarkdown(rawDescription) || undefined

  if (description && getAutoTranslateWger()) {
    const sourceLang = wgerLanguageCode(translation?.language ?? 2)
    if (sourceLang !== 'nl') {
      try {
        description = await translateMarkdownToDutch(description, sourceLang)
      } catch {
        // Keep original markdown when translation is unavailable.
      }
    }
  }

  return {
    id: createId(),
    name: exerciseDisplayName(info, language),
    externalId: String(info.id),
    metric: 'reps',
    target: 10,
    weightKg: guessDefaultWeight(equipment),
    restSeconds: 75,
    equipment,
    media,
    description,
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
    description: 'Geïmporteerd uit Wger open-source database',
    exercises,
    sets,
    restBetweenSets: 75,
    favorite: false,
    source: 'wger',
    estimatedMinutes: recalcWorkoutDuration(exercises, sets),
    tags: ['wger', 'imported'],
  }
}
