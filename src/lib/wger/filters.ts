import type { EquipmentCategory } from '@/types/locker'
import type { WgerEquipment, WgerExerciseCategory, WgerMuscle } from '@/types/wger'
import { mapWgerEquipment } from '@/lib/wger/mapEquipment'

/** Representative muscle SVG per wger exercise category (categories have no API images). */
const CATEGORY_MUSCLE_IMAGES: Record<string, string> = {
  Abs: 'https://wger.de/static/images/muscles/main/muscle-6.592f938fa8c7.svg',
  Arms: 'https://wger.de/static/images/muscles/main/muscle-1.8790f8a0b3b9.svg',
  Back: 'https://wger.de/static/images/muscles/main/muscle-12.6a5de7a0e373.svg',
  Calves: 'https://wger.de/static/images/muscles/main/muscle-7.edbd8c381b0c.svg',
  Cardio: 'https://wger.de/static/images/muscles/main/muscle-10.b1445ea1acf6.svg',
  Chest: 'https://wger.de/static/images/muscles/main/muscle-4.c9fa9a228bc8.svg',
  Legs: 'https://wger.de/static/images/muscles/main/muscle-10.b1445ea1acf6.svg',
  Shoulders: 'https://wger.de/static/images/muscles/main/muscle-2.e1e1205a3202.svg',
}

export function categoryFilterImage(category: WgerExerciseCategory): string | null {
  return CATEGORY_MUSCLE_IMAGES[category.name] ?? null
}

export function equipmentFilterCategory(equipment: WgerEquipment): EquipmentCategory {
  const mapped = mapWgerEquipment([equipment])
  return mapped[0] ?? 'other'
}

export function muscleFilterLabel(muscle: WgerMuscle): string {
  return muscle.name_en || muscle.name
}
