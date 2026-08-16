import type { SessionSummary } from '@/lib/workout/sessionSummary'
import { normalizeSummary } from '@/lib/workout/sessionSummary'
import { createId, readStore, subscribeStore, writeStore } from './localStore'

const KEY = 'solo-history'

export type SessionRecord = {
  id: string
  workoutName: string
  workoutIds: string[]
  exerciseCount: number
  durationMinutes: number
  completedAt: string
  summary: SessionSummary
}

type LegacySessionRecord = Omit<SessionRecord, 'summary'> & { summary?: SessionSummary }

function normalizeRecord(raw: LegacySessionRecord): SessionRecord {
  if (raw.summary) {
    return {
      ...(raw as SessionRecord),
      summary: normalizeSummary(raw.summary),
    }
  }

  return {
    id: raw.id,
    workoutName: raw.workoutName,
    workoutIds: raw.workoutIds ?? [],
    exerciseCount: raw.exerciseCount ?? 0,
    durationMinutes: raw.durationMinutes ?? 0,
    completedAt: raw.completedAt,
    summary: normalizeSummary({
      workoutName: raw.workoutName,
      exercises: [],
      sets: [],
      stats: {
        phaseLabel: 'Set',
        totalSets: 0,
        totalExercisesCompleted: raw.exerciseCount ?? 0,
        avgSetDurationSeconds: 0,
        avgExercisePerSetSeconds: 0,
        fastestSet: null,
        slowestSet: null,
        fastestExercise: null,
        slowestExercise: null,
        paceChangePercent: 0,
        paceLabel: 'Stabiel tempo',
        avgRpe: null,
      },
      rpeBySet: {},
      totalDurationSeconds: Math.max(60, (raw.durationMinutes ?? 1) * 60),
      startedAt: raw.completedAt,
      completedAt: raw.completedAt,
    }),
  }
}

// Memoize the normalized snapshot against the raw (cached) array reference so
// getHistory() returns a stable reference for useSyncExternalStore.
let normalizedCache: { raw: LegacySessionRecord[]; value: SessionRecord[] } | null = null

export function getHistory(): SessionRecord[] {
  const raw = readStore<LegacySessionRecord[]>(KEY, [])
  if (normalizedCache && normalizedCache.raw === raw) {
    return normalizedCache.value
  }
  const value = raw.map(normalizeRecord)
  normalizedCache = { raw, value }
  return value
}

export function getSessionRecord(id: string): SessionRecord | undefined {
  return getHistory().find((record) => record.id === id)
}

export function addSessionRecord(record: Omit<SessionRecord, 'id'>): SessionRecord {
  const item: SessionRecord = { ...record, id: createId() }
  writeStore(KEY, [item, ...readStore<LegacySessionRecord[]>(KEY, [])].slice(0, 100))
  return item
}

export function removeSessionRecord(id: string): void {
  writeStore(
    KEY,
    readStore<LegacySessionRecord[]>(KEY, []).filter((record) => record.id !== id),
  )
}

/** Replace the summary blob for a history entry (e.g. after AI report generation). */
export function updateSessionRecordSummary(id: string, summary: SessionSummary): void {
  const raw = readStore<LegacySessionRecord[]>(KEY, [])
  const next = raw.map((record) =>
    record.id === id ? { ...record, summary, workoutName: summary.workoutName } : record,
  )
  writeStore(KEY, next)
}

/** Patch the most recent history row matching a completedAt timestamp. */
export function updateLatestMatchingSummary(
  completedAt: string,
  summary: SessionSummary,
): void {
  const raw = readStore<LegacySessionRecord[]>(KEY, [])
  const index = raw.findIndex((record) => record.completedAt === completedAt)
  if (index < 0) return
  const next = [...raw]
  next[index] = { ...next[index], summary, workoutName: summary.workoutName }
  writeStore(KEY, next)
}

export function clearHistory(): void {
  writeStore(KEY, [])
}

export function subscribeHistory(onChange: () => void): () => void {
  return subscribeStore(KEY, onChange)
}

export function getHistoryStats() {
  const history = getHistory()
  const now = Date.now()
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000
  const thisWeek = history.filter((h) => new Date(h.completedAt).getTime() >= weekAgo)

  return {
    totalSessions: history.length,
    sessionsThisWeek: thisWeek.length,
    totalMinutes: history.reduce((s, h) => s + h.durationMinutes, 0),
    lastSession: history[0] ?? null,
  }
}
