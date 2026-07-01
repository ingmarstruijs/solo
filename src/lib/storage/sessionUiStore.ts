import { readStore, subscribeStore, writeStore } from './localStore'

const CAMERA_ENABLED_KEY = 'solo-camera-enabled'

export function getCameraEnabled(): boolean {
  return readStore<boolean>(CAMERA_ENABLED_KEY, false)
}

export function setCameraEnabled(enabled: boolean): void {
  writeStore(CAMERA_ENABLED_KEY, enabled)
}

export function subscribeCameraEnabled(onChange: () => void): () => void {
  return subscribeStore(CAMERA_ENABLED_KEY, onChange)
}
