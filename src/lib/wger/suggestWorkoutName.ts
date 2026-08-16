import type { WgerExerciseInfo } from '@/types/wger'
import { i18n } from '@/i18n'
import { getAppLocale } from '@/i18n'
import { wgerIdForLocale } from '@/i18n/registry'
import { exerciseDisplayName } from './client'
import { mapWgerEquipment } from './mapEquipment'

function categoryLabel(name: string): string {
  const key = name.toLowerCase()
  const translated = i18n.t(`workouts:categories.${key}`)
  if (translated === `workouts:categories.${key}`) return name
  return translated
}

function equipmentThemeLabel(category: string): string | undefined {
  const translated = i18n.t(`workouts:equipmentThemes.${category}`)
  if (translated === `workouts:equipmentThemes.${category}`) return undefined
  return translated
}

function mostCommon<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined
  const counts = new Map<T, number>()
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1)
  let best: T | undefined
  let bestCount = 0
  for (const [item, count] of counts) {
    if (count > bestCount) {
      best = item
      bestCount = count
    }
  }
  return best
}

function dominantEquipmentTheme(infos: WgerExerciseInfo[]): string | undefined {
  const all = infos.flatMap((i) => mapWgerEquipment(i.equipment))
  if (all.length === 0) return undefined
  const dominant = mostCommon(all)
  if (!dominant) return undefined
  const share = all.filter((e) => e === dominant).length / all.length
  if (share < 0.6) return undefined
  return equipmentThemeLabel(dominant)
}

/** Suggest a short workout title from a Wger import selection (active app locale). */
export function suggestWgerWorkoutName(infos: WgerExerciseInfo[]): string {
  const langId = wgerIdForLocale(getAppLocale())
  if (infos.length === 0) return i18n.t('workouts:suggestNew')
  if (infos.length === 1) return exerciseDisplayName(infos[0], langId)

  if (infos.length === 2) {
    return `${exerciseDisplayName(infos[0], langId)} & ${exerciseDisplayName(infos[1], langId)}`
  }

  const categories = infos.map((i) => i.category.name.toLowerCase())
  const uniqueCategories = [...new Set(categories)]
  const dominantCategory = mostCommon(categories)
  const dominantShare =
    dominantCategory != null
      ? categories.filter((c) => c === dominantCategory).length / infos.length
      : 0

  if (uniqueCategories.length === 1) {
    return categoryLabel(uniqueCategories[0])
  }

  if (dominantShare >= 0.6 && dominantCategory) {
    return categoryLabel(dominantCategory)
  }

  const equipmentTheme = dominantEquipmentTheme(infos)
  if (equipmentTheme) return equipmentTheme

  if (uniqueCategories.length >= 3) {
    return i18n.t('workouts:fullBody')
  }

  const [a, b] = uniqueCategories.map(categoryLabel)
  return `${a} & ${b}`
}
