import { i18n } from '@/i18n'

export type ThemeId = 'ochtend' | 'middag' | 'avond' | 'nacht'

export type ThemePreference = 'auto' | ThemeId

export type ThemeDefinition = {
  id: ThemeId
  label: string
  description: string
  timeRange: string
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'ochtend',
    label: 'Morning',
    description: 'Soft light, warm dawn',
    timeRange: '06:00 – 11:59',
  },
  {
    id: 'middag',
    label: 'Afternoon',
    description: 'Bright, crisp daylight',
    timeRange: '12:00 – 17:59',
  },
  {
    id: 'avond',
    label: 'Evening',
    description: 'Cool dusk, indigo tones',
    timeRange: '18:00 – 21:59',
  },
  {
    id: 'nacht',
    label: 'Night',
    description: 'Deep black, minimal SOLO blue',
    timeRange: '22:00 – 05:59',
  },
]

const STORAGE_KEY = 'solo-theme'
const BOUNDARY_HOURS = [6, 12, 18, 22] as const

/** Map clock hour (0–23) to the matching day-part theme. */
export function themeFromHour(hour: number): ThemeId {
  if (hour >= 6 && hour < 12) return 'ochtend'
  if (hour >= 12 && hour < 18) return 'middag'
  if (hour >= 18 && hour < 22) return 'avond'
  return 'nacht'
}

export function themeFromDate(date = new Date()): ThemeId {
  return themeFromHour(date.getHours())
}

export function getThemePreference(): ThemePreference {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === 'auto') return 'auto'
  if (raw && THEMES.some((t) => t.id === raw)) return raw as ThemeId
  return 'auto'
}

export function setThemePreference(preference: ThemePreference): void {
  localStorage.setItem(STORAGE_KEY, preference)
}

export function getEffectiveTheme(date = new Date()): ThemeId {
  const preference = getThemePreference()
  if (preference === 'auto') return themeFromDate(date)
  return preference
}

export function applyTheme(date = new Date()): void {
  document.documentElement.dataset.theme = getEffectiveTheme(date)
}

/** @deprecated Use getEffectiveTheme */
export function getStoredTheme(): ThemeId {
  return getEffectiveTheme()
}

/** @deprecated Use setThemePreference */
export function setStoredTheme(id: ThemeId): void {
  setThemePreference(id)
}

/** @deprecated Use applyTheme */
export function applyStoredTheme(): void {
  applyTheme()
}

export function getThemeLabel(id: ThemeId): string {
  const key = `themes:${id}.label`
  const translated = i18n.t(key)
  if (translated !== key) return translated
  return THEMES.find((t) => t.id === id)?.label ?? id
}

export function getThemeDescription(id: ThemeId): string {
  const key = `themes:${id}.description`
  const translated = i18n.t(key)
  if (translated !== key) return translated
  return THEMES.find((t) => t.id === id)?.description ?? ''
}

function nextBoundaryDate(from = new Date()): Date {
  for (let dayOffset = 0; dayOffset < 2; dayOffset++) {
    for (const hour of BOUNDARY_HOURS) {
      const candidate = new Date(from)
      candidate.setDate(candidate.getDate() + dayOffset)
      candidate.setHours(hour, 0, 0, 0)
      if (candidate > from) return candidate
    }
  }
  const fallback = new Date(from)
  fallback.setDate(fallback.getDate() + 1)
  fallback.setHours(BOUNDARY_HOURS[0], 0, 0, 0)
  return fallback
}

function msUntilNextBoundary(from = new Date()): number {
  return Math.max(1_000, nextBoundaryDate(from).getTime() - from.getTime())
}

let refreshTimer: ReturnType<typeof setTimeout> | undefined

/** Re-apply theme when the day-part boundary is crossed (only when preference is auto). */
export function startAutoThemeWatcher(onChange: () => void): () => void {
  function schedule() {
    refreshTimer = window.setTimeout(() => {
      if (getThemePreference() === 'auto') {
        const before = document.documentElement.dataset.theme
        applyTheme()
        if (document.documentElement.dataset.theme !== before) onChange()
      }
      schedule()
    }, msUntilNextBoundary())
  }

  function onVisible() {
    if (document.visibilityState !== 'visible') return
    if (getThemePreference() !== 'auto') return
    const before = document.documentElement.dataset.theme
    applyTheme()
    if (document.documentElement.dataset.theme !== before) onChange()
  }

  schedule()
  document.addEventListener('visibilitychange', onVisible)

  return () => {
    if (refreshTimer != null) window.clearTimeout(refreshTimer)
    document.removeEventListener('visibilitychange', onVisible)
  }
}
