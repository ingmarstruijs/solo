import { useCallback, useSyncExternalStore } from 'react'
import {
  getGarminConnected,
  setGarminConnected,
  subscribeGarminConnected,
} from '@/lib/storage/garminStore'

export function useGarminConnected() {
  const connected = useSyncExternalStore(
    subscribeGarminConnected,
    getGarminConnected,
    getGarminConnected,
  )
  const setConnected = useCallback((value: boolean) => setGarminConnected(value), [])
  const toggleConnected = useCallback(() => setGarminConnected(!getGarminConnected()), [])
  return { connected, setConnected, toggleConnected }
}
