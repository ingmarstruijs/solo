import { useCallback, useSyncExternalStore } from 'react'

type SelectionSnapshot = {
  selectionMode: boolean
  selectedIds: string[]
}

let selectionMode = false
let selectedIds = new Set<string>()
const listeners = new Set<() => void>()

let cachedSnapshot: SelectionSnapshot = {
  selectionMode: false,
  selectedIds: [],
}

function rebuildSnapshot() {
  cachedSnapshot = {
    selectionMode,
    selectedIds: [...selectedIds],
  }
}

function emit() {
  rebuildSnapshot()
  listeners.forEach((l) => l())
}

function getSnapshot(): SelectionSnapshot {
  return cachedSnapshot
}

export function useWorkoutSelection() {
  const state = useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange)
      return () => listeners.delete(onChange)
    },
    getSnapshot,
    getSnapshot,
  )

  const setSelectionMode = useCallback((enabled: boolean) => {
    selectionMode = enabled
    if (!enabled) selectedIds = new Set()
    emit()
  }, [])

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(!selectionMode)
  }, [setSelectionMode])

  const toggleMulti = useCallback((id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedIds = next
    emit()
  }, [])

  const clearSelection = useCallback(() => {
    selectedIds = new Set()
    emit()
  }, [])

  const removeFromSelection = useCallback((id: string) => {
    if (!selectedIds.has(id)) return
    const next = new Set(selectedIds)
    next.delete(id)
    selectedIds = next
    emit()
  }, [])

  return {
    selectionMode: state.selectionMode,
    selectedIds: state.selectedIds,
    selectedCount: state.selectedIds.length,
    setSelectionMode,
    toggleSelectionMode,
    toggleMulti,
    clearSelection,
    removeFromSelection,
  }
}
