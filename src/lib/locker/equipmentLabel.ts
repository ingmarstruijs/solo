import { getEquipmentMeta } from '@/lib/locker/equipmentCatalog'
import { i18n } from '@/i18n'
import type { EquipmentCategory } from '@/types/locker'

/** Localized equipment label for the active app language. */
export function equipmentLabel(category: EquipmentCategory): string {
  const key = `locker:equipment.${category}`
  const translated = i18n.t(key)
  if (translated !== key) return translated
  return getEquipmentMeta(category).label
}
