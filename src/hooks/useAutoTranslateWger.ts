import { useSyncExternalStore } from 'react'
import {
  getAutoTranslateWger,
  setAutoTranslateWger,
  subscribeAutoTranslateWger,
} from '@/lib/storage/translateStore'

export function useAutoTranslateWger() {
  const enabled = useSyncExternalStore(subscribeAutoTranslateWger, getAutoTranslateWger, () => true)

  return {
    enabled,
    setEnabled: setAutoTranslateWger,
    toggle: () => setAutoTranslateWger(!getAutoTranslateWger()),
  }
}
