import { useCallback, useSyncExternalStore } from 'react'
import {
  getFormCuesEnabled,
  setFormCuesEnabled,
  subscribeFormCuesEnabled,
} from '@/lib/storage/sessionUiStore'

export function useFormCuesEnabled() {
  const enabled = useSyncExternalStore(
    subscribeFormCuesEnabled,
    getFormCuesEnabled,
    getFormCuesEnabled,
  )
  const setEnabled = useCallback((value: boolean) => setFormCuesEnabled(value), [])
  return { enabled, setEnabled }
}
