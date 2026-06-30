import type { WgerTranslation } from '@/types/wger'
import { WGER_DESCRIPTION_PRIORITY } from '@/lib/translate/wgerLanguages'

export function pickWgerTranslation(
  translations: WgerTranslation[],
  preferredLanguageIds: readonly number[] = WGER_DESCRIPTION_PRIORITY,
): WgerTranslation | undefined {
  for (const languageId of preferredLanguageIds) {
    const hit = translations.find(
      (t) => t.language === languageId && t.description.trim().length > 0,
    )
    if (hit) return hit
  }

  return translations.find((t) => t.description.trim().length > 0) ?? translations[0]
}
