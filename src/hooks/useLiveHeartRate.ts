import { useCallback, useSyncExternalStore } from 'react'
import {
  clearHrConnectionError,
  connectHeartRateMonitor,
  disconnectHeartRateMonitor,
  getHrConnectionState,
  subscribeHrConnection,
} from '@/lib/ble/hrConnection'

export function useLiveHeartRate() {
  const state = useSyncExternalStore(
    subscribeHrConnection,
    getHrConnectionState,
    getHrConnectionState,
  )

  const connect = useCallback(() => {
    void connectHeartRateMonitor()
  }, [])

  const disconnect = useCallback(() => {
    disconnectHeartRateMonitor()
  }, [])

  const clearError = useCallback(() => {
    clearHrConnectionError()
  }, [])

  return {
    ...state,
    live: state.status === 'connected' && state.bpm != null,
    connect,
    disconnect,
    clearError,
  }
}
