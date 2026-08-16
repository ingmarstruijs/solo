import type { PlateConfig, PlateItemUsed } from '@/types/workout'
import type { EquipmentCategory, LockerItem } from '@/types/locker'
import { i18n } from '@/i18n'

const DEFAULT_BAR_KG = 20

function lockerPlates(items: LockerItem[]): LockerItem[] {
  return items.filter((i) => i.category === 'weight_plate' && i.weightKg != null)
}

function lockerDumbbells(items: LockerItem[]): LockerItem[] {
  return items.filter((i) => i.category === 'dumbbell' && i.weightKg != null)
}

function lockerKettlebells(items: LockerItem[]): LockerItem[] {
  return items.filter((i) => i.category === 'kettlebell' && i.weightKg != null)
}

export function getBarWeight(items: LockerItem[]): number {
  const bar = items.find((i) => i.category === 'barbell' && i.weightKg != null)
  return bar?.weightKg ?? DEFAULT_BAR_KG
}

function findClosestItem(items: LockerItem[], targetKg: number): LockerItem | null {
  if (items.length === 0) return null
  return items.reduce((best, item) =>
    Math.abs((item.weightKg ?? 0) - targetKg) < Math.abs((best.weightKg ?? 0) - targetKg)
      ? item
      : best,
  )
}

function greedyPlatesFromLocker(
  targetPerSide: number,
  plates: LockerItem[],
): { perSide: number[]; itemsUsed: PlateItemUsed[] } {
  const sorted = [...plates].sort((a, b) => (b.weightKg ?? 0) - (a.weightKg ?? 0))
  const perSide: number[] = []
  const used = new Map<number, { item: LockerItem; count: number }>()
  let remaining = targetPerSide

  for (const plate of sorted) {
    const w = plate.weightKg!
    while (remaining >= w - 0.001) {
      perSide.push(w)
      remaining = Math.round((remaining - w) * 100) / 100
      const entry = used.get(w) ?? { item: plate, count: 0 }
      entry.count++
      used.set(w, entry)
    }
  }

  const itemsUsed: PlateItemUsed[] = [...used.values()].map(({ item, count }) => ({
    label: item.name,
    weightKg: item.weightKg!,
    count: count * 2,
    category: 'weight_plate' as const,
  }))

  return { perSide, itemsUsed }
}

export function configurePlates(
  targetKg: number,
  items: LockerItem[],
  equipment: EquipmentCategory[],
): PlateConfig {
  const empty: PlateConfig = {
    mode: 'bodyweight',
    targetKg,
    barWeightKg: 0,
    platesPerSide: [],
    totalKg: 0,
    achievable: true,
    itemsUsed: [],
  }

  if (targetKg <= 0 || equipment.length === 0) return empty

  const primary = equipment[0]

  if (primary === 'dumbbell') {
    const match = findClosestItem(lockerDumbbells(items), targetKg)
    const actual = match?.weightKg ?? targetKg
    return {
      mode: 'dumbbell',
      targetKg,
      barWeightKg: 0,
      platesPerSide: [],
      totalKg: actual,
      achievable: match != null,
      itemsUsed: match
        ? [{ label: match.name, weightKg: actual, count: 2, category: 'dumbbell' }]
        : [],
      note: match ? i18n.t('workouts:platePerHand') : i18n.t('workouts:plateNoDumbbell', { kg: targetKg }),
    }
  }

  if (primary === 'kettlebell') {
    const match = findClosestItem(lockerKettlebells(items), targetKg)
    const actual = match?.weightKg ?? targetKg
    return {
      mode: 'kettlebell',
      targetKg,
      barWeightKg: 0,
      platesPerSide: [],
      totalKg: actual,
      achievable: match != null,
      itemsUsed: match
        ? [{ label: match.name, weightKg: actual, count: 1, category: 'kettlebell' }]
        : [],
      note: match ? undefined : i18n.t('workouts:plateNoKettlebell', { kg: targetKg }),
    }
  }

  if (primary !== 'barbell' && primary !== 'weight_plate') {
    return { ...empty, totalKg: targetKg, note: i18n.t('workouts:plateNoWeightNeeded') }
  }

  const barItem = items.find((i) => i.category === 'barbell')
  const barWeight = getBarWeight(items)
  const plates = lockerPlates(items)

  if (plates.length === 0) {
    return {
      mode: 'barbell',
      targetKg,
      barWeightKg: barWeight,
      platesPerSide: [],
      totalKg: barWeight,
      achievable: targetKg <= barWeight,
      itemsUsed: barItem
        ? [{ label: barItem.name, weightKg: barWeight, count: 1, category: 'barbell' }]
        : [],
      note: i18n.t('workouts:plateNoPlatesInLocker'),
    }
  }

  const perSideTarget = Math.max(0, (targetKg - barWeight) / 2)
  const { perSide, itemsUsed: plateItems } = greedyPlatesFromLocker(perSideTarget, plates)
  const barUsed: PlateItemUsed[] = barItem
    ? [{ label: barItem.name, weightKg: barWeight, count: 1, category: 'barbell' }]
    : [{ label: i18n.t('workouts:olympicBar'), weightKg: barWeight, count: 1, category: 'barbell' }]

  const totalKg = barWeight + perSide.reduce((s, p) => s + p, 0) * 2

  return {
    mode: 'barbell',
    targetKg,
    barWeightKg: barWeight,
    platesPerSide: perSide,
    totalKg,
    achievable: totalKg >= targetKg - 0.5,
    itemsUsed: [...barUsed, ...plateItems],
    note: totalKg < targetKg ? i18n.t('workouts:plateMaxWithLocker', { kg: totalKg }) : undefined,
  }
}
