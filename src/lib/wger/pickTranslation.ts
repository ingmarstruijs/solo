import type { WgerTranslation } from '@/types/wger'
import { getAppLocale } from '@/i18n'
import { descriptionPriorityForLocale } from '@/lib/translate/wgerLanguages'

export function pickWgerTranslation(
  translations: WgerTranslation[],
  preferredLanguageIds: readonly number[] = descriptionPriorityForLocale(getAppLocale()),
): WgerTranslation | undefined {
  for (const languageId of preferredLanguageIds) {
    const hit = translations.find(
      (t) => t.language === languageId && t.description.trim().length > 0,
    )
    if (hit) return hit
  }

  return translations.find((t) => t.description.trim().length > 0) ?? translations[0]
}
