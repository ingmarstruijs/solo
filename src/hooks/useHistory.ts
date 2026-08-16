import { useCallback, useSyncExternalStore } from 'react'
import {
  clearHistory as clearHistoryStore,
  getHistory,
  getHistoryStats,
  getSessionRecord,
  removeSessionRecord,
  subscribeHistory,
} from '@/lib/storage/historyStore'
import { deleteSessionMoments } from '@/lib/storage/sessionMomentsStore'

export function useHistory() {
  const history = useSyncExternalStore(subscribeHistory, getHistory, getHistory)

  const remove = useCallback((id: string) => {
    const record = getSessionRecord(id)
    if (record?.summary.momentIds?.length) {
      void deleteSessionMoments(record.summary.momentIds)
    }
    removeSessionRecord(id)
  }, [])

  const clearAll = useCallback(() => {
    const ids = getHistory().flatMap((record) => record.summary.momentIds ?? [])
    if (ids.length > 0) void deleteSessionMoments(ids)
    clearHistoryStore()
  }, [])

  return {
    history,
    stats: getHistoryStats(),
    remove,
    clearAll,
  }
}
