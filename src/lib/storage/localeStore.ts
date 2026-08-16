import { DEFAULT_LOCALE, isAppLocale, type AppLocale } from '@/i18n/registry'
import { readStore, subscribeStore, writeStore } from './localStore'

const KEY = 'solo-locale'

export function getLocale(): AppLocale {
  const stored = readStore<string | null>(KEY, null)
  if (stored && isAppLocale(stored)) return stored
  return DEFAULT_LOCALE
}

export function setLocale(locale: AppLocale): void {
  writeStore(KEY, locale)
}

export function subscribeLocale(onChange: () => void): () => void {
  return subscribeStore(KEY, onChange)
}
