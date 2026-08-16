import type { AppLocale } from '@/i18n/registry'

/** Per-locale string map for exercise text. */
export type LocalizedText = Partial<Record<AppLocale, string>>
