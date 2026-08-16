/** Supported app locales — add a language here + a locales/<code>/ tree. */
export const APP_LOCALES = [
  {
    code: 'en',
    nativeName: 'English',
    wgerId: 2,
    speechTags: ['en-US', 'en-GB', 'en'],
  },
  {
    code: 'nl',
    nativeName: 'Nederlands',
    wgerId: 6,
    speechTags: ['nl-NL', 'nl-BE', 'nl'],
  },
  {
    code: 'de',
    nativeName: 'Deutsch',
    wgerId: 1,
    speechTags: ['de-DE', 'de-AT', 'de-CH', 'de'],
  },
  {
    code: 'fr',
    nativeName: 'Français',
    wgerId: 12,
    speechTags: ['fr-FR', 'fr-BE', 'fr-CA', 'fr'],
  },
] as const

export type AppLocale = (typeof APP_LOCALES)[number]['code']

export const DEFAULT_LOCALE: AppLocale = 'en'

export const APP_LOCALE_CODES: AppLocale[] = APP_LOCALES.map((l) => l.code)

export function isAppLocale(value: string): value is AppLocale {
  return (APP_LOCALE_CODES as string[]).includes(value)
}

export function getLocaleMeta(code: AppLocale) {
  return APP_LOCALES.find((l) => l.code === code) ?? APP_LOCALES[0]
}

export function wgerIdForLocale(code: AppLocale): number {
  return getLocaleMeta(code).wgerId
}

/** Primary BCP-47 tag for SpeechSynthesis / html lang. */
export function speechTagForLocale(code: AppLocale): string {
  return getLocaleMeta(code).speechTags[0]
}
