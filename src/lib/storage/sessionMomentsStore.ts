import { createId } from '@/lib/storage/localStore'

const DB_NAME = 'solo-session-moments'
const DB_VERSION = 1
const STORE = 'moments'

export type SessionMomentMeta = {
  id: string
  sessionKey: string
  capturedAt: string
  setNumber: number
  exerciseId?: string
  exerciseName?: string
  kind: 'done' | 'auto'
  mimeType: string
}

export type SessionMoment = SessionMomentMeta & {
  blob: Blob
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('sessionKey', 'sessionKey', { unique: false })
      }
    }
  })
}

function idbReq<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

export async function saveSessionMoment(input: {
  sessionKey: string
  blob: Blob
  setNumber: number
  exerciseId?: string
  exerciseName?: string
  kind?: 'done' | 'auto'
}): Promise<SessionMomentMeta> {
  const meta: SessionMomentMeta = {
    id: createId(),
    sessionKey: input.sessionKey,
    capturedAt: new Date().toISOString(),
    setNumber: input.setNumber,
    exerciseId: input.exerciseId,
    exerciseName: input.exerciseName,
    kind: input.kind ?? 'done',
    mimeType: input.blob.type || 'image/jpeg',
  }

  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    await idbReq(tx.objectStore(STORE).put({ ...meta, blob: input.blob }))
  } finally {
    db.close()
  }
  return meta
}

export async function getSessionMomentsByIds(ids: string[]): Promise<SessionMoment[]> {
  if (ids.length === 0) return []
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const rows = await Promise.all(ids.map((id) => idbReq(store.get(id))))
    return rows.filter((row): row is SessionMoment => Boolean(row?.blob))
  } finally {
    db.close()
  }
}

export async function getSessionMomentsBySessionKey(sessionKey: string): Promise<SessionMoment[]> {
  if (!sessionKey) return []
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readonly')
    const index = tx.objectStore(STORE).index('sessionKey')
    const rows = await idbReq(index.getAll(sessionKey))
    return (rows as SessionMoment[]).filter((row) => Boolean(row?.blob))
  } finally {
    db.close()
  }
}

export async function deleteSessionMoments(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    await Promise.all(ids.map((id) => idbReq(store.delete(id))))
  } finally {
    db.close()
  }
}

/** Pick evenly spaced moments for a short proof reel (max `limit`). */
export function selectProofMoments<T>(moments: T[], limit = 3): T[] {
  if (moments.length <= limit) return moments
  if (limit <= 1) return [moments[moments.length - 1]!]
  const picked: T[] = []
  for (let i = 0; i < limit; i += 1) {
    const index = Math.round((i * (moments.length - 1)) / (limit - 1))
    const item = moments[index]
    if (item && !picked.includes(item)) picked.push(item)
  }
  return picked
}
