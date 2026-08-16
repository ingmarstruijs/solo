import type { EquipmentCategory } from '@/types/locker'
import type { OverloadTarget, PlateItemUsed, WorkoutTemplate } from '@/types/workout'
import { equipmentLabel } from '@/lib/locker/equipmentLabel'
import { getEquipmentMeta } from '@/lib/locker/equipmentCatalog'
import { getAppLocale } from '@/i18n'

export type SessionMaterialLine = {
  id: string
  category: EquipmentCategory
  label: string
  detail?: string
}

function itemKey(item: PlateItemUsed): string {
  return `${item.category}:${item.label}:${item.weightKg}`
}

function formatWeightItem(item: PlateItemUsed): SessionMaterialLine {
  const countPrefix = item.count > 1 ? `${item.count}× ` : ''
  const weightSuffix = item.weightKg > 0 ? ` · ${item.weightKg} kg` : ''
  return {
    id: itemKey(item),
    category: item.category,
    label: `${countPrefix}${item.label || equipmentLabel(item.category)}${weightSuffix}`,
  }
}

/** Equipment that should be prepared for the session. */
export function collectWorkoutMaterials(
  workout: WorkoutTemplate,
  targets: OverloadTarget[],
): SessionMaterialLine[] {
  const mergedWeights = new Map<string, PlateItemUsed>()

  for (const target of targets) {
    const items = target.plateConfig?.itemsUsed ?? []
    for (const item of items) {
      const key = itemKey(item)
      const existing = mergedWeights.get(key)
      if (!existing || item.count > existing.count) {
        mergedWeights.set(key, { ...item })
      }
    }
  }

  const weightCategories = new Set(
    [...mergedWeights.values()].map((item) => item.category),
  )

  const ancillary = new Set<EquipmentCategory>()
  for (const ex of workout.exercises) {
    for (const cat of ex.equipment) {
      if (cat === 'bodyweight' || cat === 'other') continue
      const meta = getEquipmentMeta(cat)
      if (meta.hasWeight && weightCategories.has(cat)) continue
      if (cat === 'weight_plate' && weightCategories.has('weight_plate')) continue
      ancillary.add(cat)
    }
  }

  const lines: SessionMaterialLine[] = [
    ...[...mergedWeights.values()].map(formatWeightItem),
    ...[...ancillary].map((cat) => ({
      id: `ancillary:${cat}`,
      category: cat,
      label: equipmentLabel(cat),
    })),
  ]

  lines.sort((a, b) => a.label.localeCompare(b.label, getAppLocale()))
  return lines
}
