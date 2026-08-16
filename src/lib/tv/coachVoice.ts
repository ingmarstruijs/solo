import { getAppLocale, i18n } from '@/i18n'
import { getLocaleMeta, speechTagForLocale, type AppLocale } from '@/i18n/registry'
import { getCoachVoiceGender, type CoachVoiceGender } from '@/lib/storage/coachStore'

const FEMALE_HINTS = [
  'female',
  'vrouw',
  'femme',
  'frau',
  'colette',
  'fenna',
  'zira',
  'samantha',
  'hazel',
  'hanna',
  'aria',
  'sonia',
  'ellen',
  'jenny',
  'michelle',
  'sabina',
]
const MALE_HINTS = [
  'male',
  'man',
  'homme',
  'mann',
  'frank',
  'maarten',
  'david',
  'mark',
  'guy',
  'ruben',
  'jeroen',
  'willem',
  'christopher',
  'james',
  'thomas',
]

let lastSpokenKey = ''
let speaking = false

export type CoachVoiceResolution = {
  voice: SpeechSynthesisVoice | null
  mode: 'native' | 'fallback' | 'pitch'
  note?: string
}

export function isCoachVoiceSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function voiceLabel(voice: SpeechSynthesisVoice): string {
  return `${voice.name} ${voice.voiceURI ?? ''}`.toLowerCase()
}

function matchesHints(voice: SpeechSynthesisVoice, hints: string[]): boolean {
  const label = voiceLabel(voice)
  return hints.some((hint) => label.includes(hint))
}

export function isFemaleVoice(voice: SpeechSynthesisVoice): boolean {
  return matchesHints(voice, FEMALE_HINTS)
}

export function isMaleVoice(voice: SpeechSynthesisVoice): boolean {
  return matchesHints(voice, MALE_HINTS)
}

function matchesLocale(voice: SpeechSynthesisVoice, locale: AppLocale): boolean {
  const lang = voice.lang.toLowerCase()
  return getLocaleMeta(locale).speechTags.some((tag) => lang.startsWith(tag.toLowerCase().split('-')[0]!))
}

function baseScore(voice: SpeechSynthesisVoice, locale: AppLocale): number {
  const lang = voice.lang.toLowerCase()
  const name = voice.name.toLowerCase()
  let score = 0
  const primary = speechTagForLocale(locale).toLowerCase().split('-')[0]!
  if (lang.startsWith(primary)) score += 50
  else if (lang.startsWith('en')) score += 20
  else score -= 20
  if (voice.localService) score += 8
  if (voice.default) score += 2
  if (name.includes('natural') || name.includes('neural') || name.includes('online')) score += 12
  return score
}

function rankByGender(
  voices: SpeechSynthesisVoice[],
  gender: CoachVoiceGender,
  locale: AppLocale,
): SpeechSynthesisVoice[] {
  return voices.slice().sort((a, b) => {
    const genderBonus = (v: SpeechSynthesisVoice) => {
      if (gender === 'female' && isFemaleVoice(v)) return 100
      if (gender === 'male' && isMaleVoice(v)) return 100
      if (gender === 'female' && isMaleVoice(v)) return -100
      if (gender === 'male' && isFemaleVoice(v)) return -100
      return 0
    }
    return baseScore(b, locale) + genderBonus(b) - (baseScore(a, locale) + genderBonus(a))
  })
}

function localeVoices(voices: SpeechSynthesisVoice[], locale: AppLocale): SpeechSynthesisVoice[] {
  return voices.filter((v) => matchesLocale(v, locale))
}

export function resolveCoachVoiceDetailed(
  voices: SpeechSynthesisVoice[],
  gender = getCoachVoiceGender(),
  locale: AppLocale = getAppLocale(),
): CoachVoiceResolution {
  if (voices.length === 0) return { voice: null, mode: 'native' }

  const local = localeVoices(voices, locale)
  const rankedAll = rankByGender(voices, gender, locale)
  const localeLabel = locale.toUpperCase()

  if (gender === 'female') {
    const localFemale = local.find(isFemaleVoice)
    if (localFemale) return { voice: localFemale, mode: 'native' }

    const anyFemale = rankedAll.find(isFemaleVoice)
    if (anyFemale) {
      return {
        voice: anyFemale,
        mode: 'fallback',
        note: i18n.t('settings:coach.noLocaleFemale', { locale: localeLabel }),
      }
    }

    const localNonMale = local.find((v) => !isMaleVoice(v))
    if (localNonMale) {
      return {
        voice: localNonMale,
        mode: 'pitch',
        note: i18n.t('settings:coach.pitchAdjusted'),
      }
    }

    const nonMale = rankedAll.find((v) => !isMaleVoice(v))
    if (nonMale) {
      return {
        voice: nonMale,
        mode: 'pitch',
        note: i18n.t('settings:coach.pitchAdjusted'),
      }
    }

    const fallbackMale = local.find(isMaleVoice) ?? rankedAll[0] ?? null
    return {
      voice: fallbackMale,
      mode: 'pitch',
      note: i18n.t('settings:coach.installHint'),
    }
  }

  const localMale = local.find(isMaleVoice)
  if (localMale) return { voice: localMale, mode: 'native' }

  const anyMale = rankedAll.find(isMaleVoice)
  if (anyMale) {
    return {
      voice: anyMale,
      mode: 'fallback',
      note: i18n.t('settings:coach.noLocaleMale', { locale: localeLabel }),
    }
  }

  const localNonFemale = local.find((v) => !isFemaleVoice(v))
  if (localNonFemale) return { voice: localNonFemale, mode: 'native' }

  return { voice: rankedAll[0] ?? null, mode: 'native' }
}

export function resolveCoachVoice(
  voices: SpeechSynthesisVoice[],
  gender = getCoachVoiceGender(),
): SpeechSynthesisVoice | null {
  return resolveCoachVoiceDetailed(voices, gender).voice
}

export function describeCoachVoice(
  voices: SpeechSynthesisVoice[],
  gender = getCoachVoiceGender(),
): { name: string | null; note?: string } {
  const resolved = resolveCoachVoiceDetailed(voices, gender)
  return { name: resolved.voice?.name ?? null, note: resolved.note }
}

function voicePitch(gender: CoachVoiceGender, resolution: CoachVoiceResolution): number {
  const voice = resolution.voice
  if (!voice) return 1

  if (resolution.mode === 'pitch') {
    return gender === 'female' ? 1.35 : 0.75
  }

  const explicitMatch =
    gender === 'female' ? isFemaleVoice(voice) : isMaleVoice(voice)

  if (explicitMatch) {
    return gender === 'female' ? 1.05 : 0.95
  }

  return gender === 'female' ? 1.2 : 0.85
}

function withVoices(run: (voices: SpeechSynthesisVoice[]) => void): void {
  const synth = window.speechSynthesis
  const voices = synth.getVoices()
  if (voices.length > 0) {
    run(voices)
    return
  }

  synth.onvoiceschanged = () => {
    synth.onvoiceschanged = null
    run(synth.getVoices())
  }
  synth.getVoices()
}

function speak(
  text: string,
  key: string,
  gender?: CoachVoiceGender,
  options: { cancel?: boolean; rate?: number } = {},
): void {
  if (!isCoachVoiceSupported() || !text.trim()) return
  if (key === lastSpokenKey && speaking) return

  const synth = window.speechSynthesis
  const selectedGender = gender ?? getCoachVoiceGender()
  const cancel = options.cancel ?? true
  const locale = getAppLocale()

  withVoices((voices) => {
    if (cancel) synth.cancel()

    const resolution = resolveCoachVoiceDetailed(voices, selectedGender, locale)
    const voice = resolution.voice
    const utterance = new SpeechSynthesisUtterance(text.trim())
    utterance.lang = voice?.lang || speechTagForLocale(locale)
    utterance.rate = options.rate ?? (resolution.mode === 'fallback' ? 0.92 : 0.95)
    utterance.pitch = voicePitch(selectedGender, resolution)
    utterance.volume = 0.9

    if (voice) utterance.voice = voice

    utterance.onstart = () => {
      speaking = true
      lastSpokenKey = key
    }
    utterance.onend = () => {
      speaking = false
    }
    utterance.onerror = () => {
      speaking = false
    }

    synth.speak(utterance)
  })
}

export function speakCoachLine(text: string, key = text, gender?: CoachVoiceGender): void {
  speak(text, key, gender, { cancel: true })
}

export function speakCoachTick(text: string, key: string, gender?: CoachVoiceGender): void {
  speak(text, key, gender, { cancel: true, rate: 1.15 })
}

export function previewCoachVoice(gender: CoachVoiceGender): void {
  stopCoachVoice()
  const line = i18n.t('session:coachPreview')
  speakCoachLine(line, `preview-${gender}-${Date.now()}`, gender)
}

export function stopCoachVoice(): void {
  if (!isCoachVoiceSupported()) return
  window.speechSynthesis.cancel()
  speaking = false
  lastSpokenKey = ''
}
