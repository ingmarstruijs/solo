import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import {
  APP_LOCALE_CODES,
  DEFAULT_LOCALE,
  isAppLocale,
  speechTagForLocale,
  type AppLocale,
} from '@/i18n/registry'
import { getLocale, setLocale as persistLocale } from '@/lib/storage/localeStore'

import enCommon from './locales/en/common.json'
import enNav from './locales/en/nav.json'
import enSettings from './locales/en/settings.json'
import enSession from './locales/en/session.json'
import enWorkouts from './locales/en/workouts.json'
import enWger from './locales/en/wger.json'
import enLocker from './locales/en/locker.json'
import enCoach from './locales/en/coach.json'

import nlCommon from './locales/nl/common.json'
import nlNav from './locales/nl/nav.json'
import nlSettings from './locales/nl/settings.json'
import nlSession from './locales/nl/session.json'
import nlWorkouts from './locales/nl/workouts.json'
import nlWger from './locales/nl/wger.json'
import nlLocker from './locales/nl/locker.json'
import nlCoach from './locales/nl/coach.json'

import deCommon from './locales/de/common.json'
import deNav from './locales/de/nav.json'
import deSettings from './locales/de/settings.json'
import deSession from './locales/de/session.json'
import deWorkouts from './locales/de/workouts.json'
import deWger from './locales/de/wger.json'
import deLocker from './locales/de/locker.json'
import deCoach from './locales/de/coach.json'

import frCommon from './locales/fr/common.json'
import frNav from './locales/fr/nav.json'
import frSettings from './locales/fr/settings.json'
import frSession from './locales/fr/session.json'
import frWorkouts from './locales/fr/workouts.json'
import frWger from './locales/fr/wger.json'
import frLocker from './locales/fr/locker.json'
import frCoach from './locales/fr/coach.json'

export const I18N_NAMESPACES = [
  'common',
  'nav',
  'settings',
  'session',
  'workouts',
  'wger',
  'locker',
  'coach',
] as const

export type I18nNamespace = (typeof I18N_NAMESPACES)[number]

const resources = {
  en: {
    common: enCommon,
    nav: enNav,
    settings: enSettings,
    session: enSession,
    workouts: enWorkouts,
    wger: enWger,
    locker: enLocker,
    coach: enCoach,
  },
  nl: {
    common: nlCommon,
    nav: nlNav,
    settings: nlSettings,
    session: nlSession,
    workouts: nlWorkouts,
    wger: nlWger,
    locker: nlLocker,
    coach: nlCoach,
  },
  de: {
    common: deCommon,
    nav: deNav,
    settings: deSettings,
    session: deSession,
    workouts: deWorkouts,
    wger: deWger,
    locker: deLocker,
    coach: deCoach,
  },
  fr: {
    common: frCommon,
    nav: frNav,
    settings: frSettings,
    session: frSession,
    workouts: frWorkouts,
    wger: frWger,
    locker: frLocker,
    coach: frCoach,
  },
} as const

function applyDocumentLang(locale: AppLocale): void {
  if (typeof document === 'undefined') return
  document.documentElement.lang = speechTagForLocale(locale).split('-')[0] ?? locale
}

let initialized = false

export function initI18n(): typeof i18n {
  if (initialized) return i18n

  const initial = getLocale()

  void i18n.use(initReactI18next).init({
    resources,
    lng: initial,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: [...APP_LOCALE_CODES],
    defaultNS: 'common',
    ns: [...I18N_NAMESPACES],
    interpolation: { escapeValue: false },
    returnNull: false,
  })

  applyDocumentLang(initial)
  initialized = true
  return i18n
}

export function changeAppLocale(locale: AppLocale): void {
  persistLocale(locale)
  applyDocumentLang(locale)
  void i18n.changeLanguage(locale)
}

export function getAppLocale(): AppLocale {
  const lng = i18n.resolvedLanguage ?? i18n.language ?? getLocale()
  return isAppLocale(lng) ? lng : DEFAULT_LOCALE
}

export { i18n }
export type { AppLocale }
