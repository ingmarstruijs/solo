import type { EquipmentCategory } from './locker'

export type PlateItemUsed = {
  label: string
  weightKg: number
  count: number
  category: EquipmentCategory
}

export type PlateConfig = {
  mode: 'barbell' | 'dumbbell' | 'kettlebell' | 'bodyweight'
  targetKg: number
  barWeightKg: number
  platesPerSide: number[]
  totalKg: number
  achievable: boolean
  note?: string
  /** Actual locker items used in this configuration. */
  itemsUsed: PlateItemUsed[]
}

/** How a set is measured — reps, time, or distance. */
export type SetMetric = 'reps' | 'time' | 'distance'

export type ExerciseKind = 'strength' | 'cardio' | 'mobility'

export type ExerciseMedia = {
  imageUrl?: string
  thumbnailUrl?: string
  attribution?: string
  source?: 'wger'
}

/** One exercise definition — sets are defined at workout level. */
export type WorkoutExercise = {
  id: string
  name: string
  externalId?: string
  kind?: ExerciseKind
  metric: SetMetric
  target: number
  weightKg: number
  restSeconds: number
  restAfterReps?: number
  equipment: EquipmentCategory[]
  /** Optioneel eigen icoon; anders afgeleid van materiaal of type. */
  icon?: EquipmentCategory
  media?: ExerciseMedia
  /** Volledige uitleg/instructies (bijv. uit Wger), platte tekst met regeleindes. */
  description?: string
  notes?: string
}

export type WorkoutSource = 'manual' | 'wger' | 'garmin-fit' | 'imported'

export type WorkoutTemplate = {
  id: string
  name: string
  description?: string
  exercises: WorkoutExercise[]
  /** Aantal sets per oefening voor deze workout (Garmin Connect-stijl). */
  sets: number
  /** Rust tussen sets in seconden. */
  restBetweenSets: number
  circuitRounds?: number
  restBetweenRounds?: number
  favorite: boolean
  source: WorkoutSource
  estimatedMinutes: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type WorkoutExport = {
  version: 1
  exportedAt: string
  workouts: WorkoutTemplate[]
}

export type WorkoutFilters = {
  maxMinutes?: number
  lockerOnly: boolean
  minRecovery: number
  favoritesOnly: boolean
}

export type OverloadTarget = {
  exerciseId: string
  originalWeightKg: number
  adjustedWeightKg: number
  adjustmentPercent: number
  reason?: string
  plateConfig?: PlateConfig
}

export type SessionExerciseNote = {
  audioNote?: string
  audioNoteText?: string
}

export type ActiveSession = {
  workout: WorkoutTemplate
  targets: OverloadTarget[]
  completedExerciseIds: string[]
  exerciseNotes: Record<string, SessionExerciseNote>
  currentSet: number
  startedAt: string
  /** When the current (incomplete) exercise timing started. */
  currentExerciseStartedAt?: string
  /** Per exercise id — accumulated active time in seconds across sets/rounds. */
  exerciseDurations?: Record<string, number>
  /** Per set/round number → exercise id → seconds in that set. */
  exerciseDurationsBySet?: Record<number, Record<string, number>>
  /** Wall-clock duration per completed set/round in seconds. */
  setWallDurations?: Record<number, number>
  /** When the current set/round timing started. */
  currentSetStartedAt?: string
  /** Last added duration per exercise — used to undo a completion. */
  lastExerciseDuration?: Record<string, number>
  /** False until the user explicitly starts exercising on the session page. */
  exercisesStarted?: boolean
  /** Exercise ids with an active pause (timer frozen). */
  pausedExerciseIds?: string[]
}
