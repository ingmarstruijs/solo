import type { EquipmentCategory } from '@/types/locker'
import type { LockerItem } from '@/types/locker'

export type EquipmentMeta = {
  category: EquipmentCategory
  label: string
  labelNl: string
  hasWeight: boolean
  hasResistance: boolean
}

export const EQUIPMENT_CATALOG: EquipmentMeta[] = [
  { category: 'dumbbell', label: 'Dumbbell', labelNl: 'Dumbbell', hasWeight: true, hasResistance: false },
  { category: 'kettlebell', label: 'Kettlebell', labelNl: 'Kettlebell', hasWeight: true, hasResistance: false },
  { category: 'medicine_ball', label: 'Medicine Ball', labelNl: 'Medicine ball', hasWeight: true, hasResistance: false },
  { category: 'resistance_band', label: 'Resistance Band', labelNl: 'Weerstandband', hasWeight: false, hasResistance: true },
  { category: 'barbell', label: 'Barbell', labelNl: 'Barbell', hasWeight: true, hasResistance: false },
  { category: 'weight_plate', label: 'Weight Plate', labelNl: 'Schijf', hasWeight: true, hasResistance: false },
  { category: 'pull_up_bar', label: 'Pull-up Bar', labelNl: 'Pull-up bar', hasWeight: false, hasResistance: false },
  { category: 'bench', label: 'Bench', labelNl: 'Bank', hasWeight: false, hasResistance: false },
  { category: 'rower', label: 'Rower', labelNl: 'Roeier', hasWeight: false, hasResistance: false },
  { category: 'cable', label: 'Cable Machine', labelNl: 'Kabel', hasWeight: false, hasResistance: false },
  { category: 'foam_roller', label: 'Foam Roller', labelNl: 'Foam roller', hasWeight: false, hasResistance: false },
  { category: 'jump_rope', label: 'Jump Rope', labelNl: 'Springtouw', hasWeight: false, hasResistance: false },
  { category: 'bodyweight', label: 'Bodyweight', labelNl: 'Lichaamsgewicht', hasWeight: false, hasResistance: false },
  { category: 'other', label: 'Other', labelNl: 'Overig', hasWeight: false, hasResistance: false },
]

export function getEquipmentMeta(category: EquipmentCategory): EquipmentMeta {
  return EQUIPMENT_CATALOG.find((e) => e.category === category) ?? EQUIPMENT_CATALOG.at(-1)!
}

/** Categories present in the locker inventory. */
export function getAvailableCategories(items: LockerItem[]): Set<EquipmentCategory> {
  return new Set(items.map((i) => i.category))
}

/** Check if locker covers all equipment categories required by an exercise list. */
export function lockerCoversEquipment(
  required: EquipmentCategory[],
  lockerCategories: Set<EquipmentCategory>,
): boolean {
  if (required.length === 0) return true
  return required.every((cat) => lockerCategories.has(cat))
}

/** Find closest available weight in locker for a category. */
export function findClosestWeight(
  items: LockerItem[],
  category: EquipmentCategory,
  targetKg: number,
): number | null {
  const weights = items
    .filter((i) => i.category === category && i.weightKg != null)
    .map((i) => i.weightKg!)
    .sort((a, b) => a - b)
  if (weights.length === 0) return null
  return weights.reduce((best, w) =>
    Math.abs(w - targetKg) < Math.abs(best - targetKg) ? w : best,
  )
}
