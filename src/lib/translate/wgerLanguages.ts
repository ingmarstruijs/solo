import { WGER_LANG_EN, WGER_LANG_NL } from '@/lib/wger/client'

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

export const WGER_DESCRIPTION_PRIORITY = [
  WGER_LANG_NL,
  WGER_LANG_EN,
  1, // de
  12, // fr
  4, // es
  13, // it
] as const
