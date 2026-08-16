import { APP_LOCALES, type AppLocale, wgerIdForLocale } from '@/i18n/registry'
import { WGER_LANG_EN } from '@/lib/wger/client'

/** wger language id → ISO 639-1 code */
export const WGER_LANGUAGE_CODES: Record<number, string> = {
  1: 'de',
  2: 'en',
  3: 'bg',
  4: 'es',
  6: 'nl',
  7: 'pt',
  8: 'el',
  9: 'cs',
  10: 'sv',
  11: 'no',
  12: 'fr',
  13: 'it',
  14: 'pl',
  16: 'tr',
}

export function wgerLanguageCode(languageId: number): string {
  return WGER_LANGUAGE_CODES[languageId] ?? 'en'
}

export function wgerLanguageIdForCode(code: string): number | undefined {
  const normalized = code.toLowerCase()
  for (const [id, lang] of Object.entries(WGER_LANGUAGE_CODES)) {
    if (lang === normalized) return Number(id)
  }
  return undefined
}

/** Prefer the active app locale, then EN, then other supported app locales, then extras. */
export function descriptionPriorityForLocale(locale: AppLocale): number[] {
  const preferred = wgerIdForLocale(locale)
  const appIds = APP_LOCALES.map((l) => l.wgerId)
  const extras = [4, 13] // es, it
  const ordered = [preferred, WGER_LANG_EN, ...appIds.filter((id) => id !== preferred && id !== WGER_LANG_EN), ...extras]
  return [...new Set(ordered)]
}

/** @deprecated Prefer {@link descriptionPriorityForLocale}. */
export const WGER_DESCRIPTION_PRIORITY = descriptionPriorityForLocale('nl')
