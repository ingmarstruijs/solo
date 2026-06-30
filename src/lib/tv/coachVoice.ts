import { getCoachVoiceGender, type CoachVoiceGender } from '@/lib/storage/coachStore'

const PREVIEW_LINE =
  'Bench press klaar. Volgende: squat. Tien reps. Zestig kilo. Rust negentig seconden.'

const FEMALE_HINTS = [
  'female',
  'vrouw',
  'femme',
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

function baseScore(voice: SpeechSynthesisVoice): number {
  const lang = voice.lang.toLowerCase()
  const name = voice.name.toLowerCase()
  let score = 0
  if (lang.startsWith('nl')) score += 50
  else if (lang.startsWith('en')) score += 20
  else if (lang.startsWith('de') || lang.startsWith('be')) score += 8
  else score -= 20
  if (voice.localService) score += 8
  if (voice.default) score += 2
  if (name.includes('natural') || name.includes('neural') || name.includes('online')) score += 12
  return score
}

function rankByGender(voices: SpeechSynthesisVoice[], gender: CoachVoiceGender): SpeechSynthesisVoice[] {
  return voices.slice().sort((a, b) => {
    const genderBonus = (v: SpeechSynthesisVoice) => {
      if (gender === 'female' && isFemaleVoice(v)) return 100
      if (gender === 'male' && isMaleVoice(v)) return 100
      if (gender === 'female' && isMaleVoice(v)) return -100
      if (gender === 'male' && isFemaleVoice(v)) return -100
      return 0
    }
    return baseScore(b) + genderBonus(b) - (baseScore(a) + genderBonus(a))
  })
}

function dutchVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return voices.filter((v) => v.lang.toLowerCase().startsWith('nl'))
}

export function resolveCoachVoiceDetailed(
  voices: SpeechSynthesisVoice[],
  gender = getCoachVoiceGender(),
): CoachVoiceResolution {
  if (voices.length === 0) return { voice: null, mode: 'native' }

  const nl = dutchVoices(voices)
  const rankedAll = rankByGender(voices, gender)

  if (gender === 'female') {
    const nlFemale = nl.find(isFemaleVoice)
    if (nlFemale) return { voice: nlFemale, mode: 'native' }

    const anyFemale = rankedAll.find(isFemaleVoice)
    if (anyFemale) {
      return {
        voice: anyFemale,
        mode: 'fallback',
        note: 'Geen NL vrouwenstem — gebruikt vrouwelijke systeemstem',
      }
    }

    const nlNonMale = nl.find((v) => !isMaleVoice(v))
    if (nlNonMale) {
      return {
        voice: nlNonMale,
        mode: 'pitch',
        note: 'Pitch aangepast (geen vrouwelijke stem gevonden)',
      }
    }

    const nonMale = rankedAll.find((v) => !isMaleVoice(v))
    if (nonMale) {
      return {
        voice: nonMale,
        mode: 'pitch',
        note: 'Pitch aangepast (geen vrouwelijke stem gevonden)',
      }
    }

    const frank = nl.find(isMaleVoice) ?? rankedAll[0] ?? null
    return {
      voice: frank,
      mode: 'pitch',
      note: 'Alleen mannenstem beschikbaar — installeer Colette/Fenna in Windows',
    }
  }

  const nlMale = nl.find(isMaleVoice)
  if (nlMale) return { voice: nlMale, mode: 'native' }

  const anyMale = rankedAll.find(isMaleVoice)
  if (anyMale) {
    return {
      voice: anyMale,
      mode: 'fallback',
      note: 'Geen NL mannenstem — gebruikt mannelijke systeemstem',
    }
  }

  const nlNonFemale = nl.find((v) => !isFemaleVoice(v))
  if (nlNonFemale) return { voice: nlNonFemale, mode: 'native' }

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

  withVoices((voices) => {
    if (cancel) synth.cancel()

    const resolution = resolveCoachVoiceDetailed(voices, selectedGender)
    const voice = resolution.voice
    const utterance = new SpeechSynthesisUtterance(text.trim())
    utterance.lang = voice?.lang.toLowerCase().startsWith('nl') ? 'nl-NL' : 'nl-NL'
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
  speakCoachLine(PREVIEW_LINE, `preview-${gender}-${Date.now()}`, gender)
}

export function stopCoachVoice(): void {
  if (!isCoachVoiceSupported()) return
  window.speechSynthesis.cancel()
  speaking = false
  lastSpokenKey = ''
}
