const CACHE_KEY = 'solo-translate-cache'
const MAX_ENTRIES = 500

type CacheEntry = {
  text: string
  at: string
}

type CacheStore = Record<string, CacheEntry>

function readCache(): CacheStore {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as CacheStore
  } catch {
    return {}
  }
}

function writeCache(cache: CacheStore): void {
  const entries = Object.entries(cache)
  if (entries.length > MAX_ENTRIES) {
    const trimmed = entries
      .sort((a, b) => a[1].at.localeCompare(b[1].at))
      .slice(-MAX_ENTRIES)
    cache = Object.fromEntries(trimmed)
  }
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
}

export function getCachedTranslation(key: string): string | null {
  return readCache()[key]?.text ?? null
}

export function setCachedTranslation(key: string, text: string): void {
  const cache = readCache()
  cache[key] = { text, at: new Date().toISOString() }
  writeCache(cache)
}

export function makeTranslationCacheKey(from: string, to: string, text: string): string {
  return `${from}|${to}|${text}`
}
