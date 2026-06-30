/** Equipment categories available in the Home Locker. */
export type EquipmentCategory =
  | 'dumbbell'
  | 'kettlebell'
  | 'medicine_ball'
  | 'resistance_band'
  | 'barbell'
  | 'weight_plate'
  | 'pull_up_bar'
  | 'bench'
  | 'rower'
  | 'cable'
  | 'foam_roller'
  | 'jump_rope'
  | 'bodyweight'
  | 'other'

export type LockerItem = {
  id: string
  name: string
  brand: string
  category: EquipmentCategory
  /** Weight in kg — relevant for dumbbells, kettlebells, plates, medicine balls. */
  weightKg?: number
  /** Resistance level for bands (light / medium / heavy / extra-heavy). */
  resistance?: string
  firstUsedAt: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export type LockerProfile = {
  id: string
  name: string
  items: LockerItem[]
  createdAt: string
  updatedAt: string
}

export type LockerCollection = {
  profiles: LockerProfile[]
  activeProfileId: string
}

export type LockerExport = {
  version: 1
  exportedAt: string
  profileName?: string
  items: LockerItem[]
}
