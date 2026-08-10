import { useEffect } from 'react'

/**
 * Keeps the screen awake while `enabled` is true (Screen Wake Lock API).
 * Re-acquires after tab visibility returns (browsers release on hide).
 */
export function useWakeLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return

    let cancelled = false
    let lock: WakeLockSentinel | null = null

    async function acquire() {
      if (cancelled || document.visibilityState !== 'visible') return
      try {
        const next = await navigator.wakeLock.request('screen')
        if (cancelled) {
          void next.release()
          return
        }
        lock = next
        next.addEventListener('release', () => {
          if (lock === next) lock = null
        })
      } catch {
        /* NotAllowedError / unsupported — ignore */
      }
    }

    void acquire()

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void acquire()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      const current = lock
      lock = null
      if (current) void current.release()
    }
  }, [enabled])
}
