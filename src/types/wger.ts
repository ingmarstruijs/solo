export type WgerEquipment = {
  id: number
  name: string
}

export type WgerExerciseCategory = {
  id: number
  name: string
}

export type WgerMuscle = {
  id: number
  name: string
  name_en: string
  is_front: boolean
  image_url_main: string
  image_url_secondary: string
}

export type WgerTranslation = {
  id: number
  name: string
  description: string
  language: number
  exercise: number
}

export type WgerExerciseImage = {
  id: number
  uuid: string
  exercise: number
  exercise_uuid: string
  image: string
  thumbnails?: {
    small?: string
    medium?: string
  }
  is_main: boolean
  license_author?: string
}

export type WgerExerciseInfo = {
  id: number
  uuid: string
  category: { id: number; name: string }
  equipment: WgerEquipment[]
  translations: WgerTranslation[]
  muscles: { id: number; name: string; name_en: string }[]
  images?: WgerExerciseImage[]
}

export type WgerPaginated<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type WgerPublicTemplate = {
  id: number
  name: string
  description: string
  days: number
  slots: number
}
