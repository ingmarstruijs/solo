import { useCallback, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { changeAppLocale, getAppLocale, type AppLocale } from '@/i18n'
import { APP_LOCALES } from '@/i18n/registry'
import { subscribeLocale } from '@/lib/storage/localeStore'

export function useLocale() {
  const locale = useSyncExternalStore(subscribeLocale, getAppLocale, getAppLocale)
  const { i18n } = useTranslation()

  const setLocale = useCallback(
    (next: AppLocale) => {
      changeAppLocale(next)
      // Ensure react-i18next subscribers refresh even if language string was same instance.
      void i18n.changeLanguage(next)
    },
    [i18n],
  )

  return { locale, setLocale, locales: APP_LOCALES }
}

export { useTranslation }
