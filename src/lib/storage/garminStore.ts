import { disconnectHeartRateMonitor } from '@/lib/ble/hrConnection'
import { readStore, subscribeStore, writeStore } from './localStore'

const GARMIN_CONNECTED_KEY = 'solo-garmin-connected'

export function getGarminConnected(): boolean {
  return readStore<boolean>(GARMIN_CONNECTED_KEY, false)
}

export function setGarminConnected(connected: boolean): void {
  writeStore(GARMIN_CONNECTED_KEY, connected)
  if (!connected) disconnectHeartRateMonitor()
}

export function subscribeGarminConnected(onChange: () => void): () => void {
  return subscribeStore(GARMIN_CONNECTED_KEY, onChange)
}
