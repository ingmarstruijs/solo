import { useCallback, useSyncExternalStore } from 'react'
import {
  getCameraEnabled,
  setCameraEnabled,
  subscribeCameraEnabled,
} from '@/lib/storage/sessionUiStore'

export function useCameraEnabled() {
  const enabled = useSyncExternalStore(subscribeCameraEnabled, getCameraEnabled, getCameraEnabled)
  const setEnabled = useCallback((value: boolean) => setCameraEnabled(value), [])
  return { enabled, setEnabled }
}
