import type { WgerExerciseInfo } from '@/types/wger'
import { exerciseDisplayName } from './client'
import { mapWgerEquipment } from './mapEquipment'

const CATEGORY_NL: Record<string, string> = {
  abs: 'Buik',
  arms: 'Armen',
  back: 'Rug',
  calves: 'Kuiten',
  cardio: 'Cardio',
  chest: 'Borst',
  legs: 'Benen',
  shoulders: 'Schouders',
}

const EQUIPMENT_NL: Partial<Record<string, string>> = {
  barbell: 'Staaf',
  dumbbell: 'Halters',
  kettlebell: 'Kettlebells',
  bodyweight: 'Eigen gewicht',
  pull_up_bar: 'Optrekstang',
  resistance_band: 'Weerstandsband',
}

function categoryNl(name: string): string {
  return CATEGORY_NL[name.toLowerCase()] ?? name
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
  return EQUIPMENT_NL[dominant]
}

/** Suggest a short Dutch workout title from a Wger import selection. */
export function suggestWgerWorkoutName(infos: WgerExerciseInfo[]): string {
  if (infos.length === 0) return 'Nieuwe workout'
  if (infos.length === 1) return exerciseDisplayName(infos[0])

  if (infos.length === 2) {
    return `${exerciseDisplayName(infos[0])} & ${exerciseDisplayName(infos[1])}`
  }

  const categories = infos.map((i) => i.category.name.toLowerCase())
  const uniqueCategories = [...new Set(categories)]
  const dominantCategory = mostCommon(categories)
  const dominantShare =
    dominantCategory != null
      ? categories.filter((c) => c === dominantCategory).length / infos.length
      : 0

  if (uniqueCategories.length === 1) {
    return categoryNl(uniqueCategories[0])
  }

  if (dominantShare >= 0.6 && dominantCategory) {
    return categoryNl(dominantCategory)
  }

  const equipmentTheme = dominantEquipmentTheme(infos)
  if (equipmentTheme) return equipmentTheme

  if (uniqueCategories.length >= 3) {
    return 'Full body'
  }

  const [a, b] = uniqueCategories.map(categoryNl)
  return `${a} & ${b}`
}
