import type { EquipmentCategory } from '@/types/locker'
import type { WgerEquipment } from '@/types/wger'

const WGER_TO_LOCKER: Record<string, EquipmentCategory> = {
  barbell: 'barbell',
  dumbbell: 'dumbbell',
  kettlebell: 'kettlebell',
  bench: 'bench',
  'incline bench': 'bench',
  'pull-up bar': 'pull_up_bar',
  'resistance band': 'resistance_band',
  'gym mat': 'other',
  'none (bodyweight exercise)': 'bodyweight',
  'none': 'bodyweight',
  bodyweight: 'bodyweight',
  'swiss ball': 'medicine_ball',
  'sz-bar': 'barbell',
}

export function mapWgerEquipment(equipment: WgerEquipment[]): EquipmentCategory[] {
  const cats = equipment
    .map((e) => WGER_TO_LOCKER[e.name.toLowerCase()])
    .filter((c): c is EquipmentCategory => c != null)
  return [...new Set(cats)]
}
