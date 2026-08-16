import { readStore, subscribeStore, writeStore } from './localStore'

const CAMERA_ENABLED_KEY = 'solo-camera-enabled'
const FORM_CUES_ENABLED_KEY = 'solo-form-cues-enabled'

export function getCameraEnabled(): boolean {
  return readStore<boolean>(CAMERA_ENABLED_KEY, false)
}

export function setCameraEnabled(enabled: boolean): void {
  writeStore(CAMERA_ENABLED_KEY, enabled)
}

export function subscribeCameraEnabled(onChange: () => void): () => void {
  return subscribeStore(CAMERA_ENABLED_KEY, onChange)
}

/** Form cues default on; only used when the session camera is active. */
export function getFormCuesEnabled(): boolean {
  return readStore<boolean>(FORM_CUES_ENABLED_KEY, true)
}

export function setFormCuesEnabled(enabled: boolean): void {
  writeStore(FORM_CUES_ENABLED_KEY, enabled)
}

export function subscribeFormCuesEnabled(onChange: () => void): () => void {
  return subscribeStore(FORM_CUES_ENABLED_KEY, onChange)
}
