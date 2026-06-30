import { readStore, subscribeStore, writeStore } from './localStore'

const AUTO_TRANSLATE_KEY = 'solo-auto-translate-wger'

export function getAutoTranslateWger(): boolean {
  return readStore<boolean>(AUTO_TRANSLATE_KEY, true)
}

export function setAutoTranslateWger(enabled: boolean): void {
  writeStore(AUTO_TRANSLATE_KEY, enabled)
}

export function subscribeAutoTranslateWger(onChange: () => void): () => void {
  return subscribeStore(AUTO_TRANSLATE_KEY, onChange)
}
