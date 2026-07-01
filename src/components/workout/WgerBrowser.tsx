import { ChevronRight, Loader2, Search, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { WgerExerciseInfo } from '@/types/wger'
import { searchExercises, exerciseDisplayName, stripHtml } from '@/lib/wger/client'
import {
  buildWorkoutFromWgerExercises,
  wgerExerciseToWorkoutExercise,
} from '@/lib/wger/importExercise'
import { suggestWgerWorkoutName } from '@/lib/wger/suggestWorkoutName'
import { mapWgerEquipment } from '@/lib/wger/mapEquipment'
import { LabActionButton } from '@/components/lab/LabPrimitives'
import { WgerExercisePreview } from '@/components/workout/WgerExercisePreview'
import { cn } from '@/lib/cn'

type WgerBrowserProps = {
  open: boolean
  onClose: () => void
  onImportWorkout: (workout: ReturnType<typeof buildWorkoutFromWgerExercises>) => void
}

export function WgerBrowser({ open, onClose, onImportWorkout }: WgerBrowserProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<WgerExerciseInfo[]>([])
  const [count, setCount] = useState(0)
  const [nextOffset, setNextOffset] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Map<number, WgerExerciseInfo>>(new Map())
  const [preview, setPreview] = useState<WgerExerciseInfo | null>(null)
  const [importing, setImporting] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)
  const sentinelRef = useRef<HTMLLIElement>(null)

  const search = useCallback(async (q: string) => {
    setLoading(true)
    setError(null)
    try {
      const page = await searchExercises(q)
      setResults(page.results)
      setCount(page.count)
      setNextOffset(page.nextOffset)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Wger API niet bereikbaar')
      setResults([])
      setCount(0)
      setNextOffset(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (nextOffset == null || loadingMore) return
    setLoadingMore(true)
    try {
      const page = await searchExercises(query, undefined, undefined, nextOffset)
      setResults((prev) => {
        const seen = new Set(prev.map((r) => r.id))
        return [...prev, ...page.results.filter((r) => !seen.has(r.id))]
      })
      setCount(page.count)
      setNextOffset(page.nextOffset)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Wger API niet bereikbaar')
    } finally {
      setLoadingMore(false)
    }
  }, [nextOffset, loadingMore, query])

  useEffect(() => {
    if (!open || loading || loadingMore || nextOffset == null) return

    const sentinel = sentinelRef.current
    const root = listRef.current
    if (!sentinel || !root) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { root, rootMargin: '160px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [open, loading, loadingMore, nextOffset, loadMore])

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => search(query), 350)
    return () => clearTimeout(timer)
  }, [query, open, search])

  useEffect(() => {
    if (open && results.length === 0 && !query) search('')
  }, [open, query, results.length, search])

  useEffect(() => {
    if (!open) {
      setPreview(null)
      setSelected(new Map())
    }
  }, [open])

  function toggleSelect(info: WgerExerciseInfo) {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(info.id)) next.delete(info.id)
      else next.set(info.id, info)
      return next
    })
  }

  async function handleImportSelected() {
    const selectedResults = Array.from(selected.values())
    if (selectedResults.length === 0) return

    setImporting(true)
    setError(null)
    try {
      const exercises = await Promise.all(
        selectedResults.map((r) => wgerExerciseToWorkoutExercise(r)),
      )

      const name = suggestWgerWorkoutName(selectedResults)

      onImportWorkout(buildWorkoutFromWgerExercises(name, exercises))
      setSelected(new Map())
      setPreview(null)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import mislukt')
    } finally {
      setImporting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/80 sm:items-center">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Sluiten" />
      <div className="relative z-10 flex max-h-[90dvh] w-full max-w-screen-sm flex-col rounded-t-card border border-line bg-surface sm:rounded-card">
        {preview ? (
          <WgerExercisePreview
            info={preview}
            selected={selected.has(preview.id)}
            onBack={() => setPreview(null)}
            onToggleSelect={() => toggleSelect(preview)}
          />
        ) : (
          <>
            <header className="flex items-center justify-between border-b border-line p-4">
              <div>
                <p className="label-mono text-faint">Open-source</p>
                <h2 className="text-lg font-bold">Zoeken</h2>
              </div>
              <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-lg text-muted active:bg-surface-2">
                <X className="size-5" />
              </button>
            </header>

            <div className="border-b border-line p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Zoek oefeningen…"
                  className="w-full rounded-xl border border-line bg-surface-2 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-solo-400/50"
                  autoFocus
                />
              </div>
              {!loading && !error && count > 0 && (
                <p className="mt-2 text-xs text-muted">
                  {results.length} van {count} oefeningen
                  {selected.size > 0 && ` · ${selected.size} geselecteerd`}
                </p>
              )}
            </div>

            <ul ref={listRef} className="flex-1 overflow-y-auto p-2">
              {loading && (
                <li className="flex items-center justify-center gap-2 py-8 text-sm text-muted">
                  <Loader2 className="size-4 animate-spin" />
                  Laden…
                </li>
              )}
              {error && (
                <li className="p-4 text-center text-sm text-danger">{error}</li>
              )}
              {!loading && !error && results.length === 0 && (
                <li className="p-4 text-center text-sm text-muted">Geen oefeningen gevonden.</li>
              )}
              {results.map((info) => {
                const name = exerciseDisplayName(info)
                const desc = stripHtml(info.translations[0]?.description ?? '').slice(0, 100)
                const equipment = mapWgerEquipment(info.equipment)
                const isSelected = selected.has(info.id)
                const thumb =
                  info.images?.find((img) => img.is_main)?.thumbnails?.small ??
                  info.images?.[0]?.thumbnails?.small

                return (
                  <li key={info.id}>
                    <div
                      className={cn(
                        'flex items-start gap-2 rounded-xl border p-2 transition-colors',
                        isSelected ? 'border-solo-400/50 bg-solo-400/5' : 'border-transparent',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSelect(info)}
                        className="mt-1 shrink-0"
                        aria-label={isSelected ? `${name} deselecteren` : `${name} selecteren`}
                      >
                        <span
                          className={cn(
                            'grid size-5 place-items-center rounded border',
                            isSelected ? 'border-solo-400 bg-solo-400 text-ink' : 'border-line',
                          )}
                        >
                          {isSelected && '✓'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreview(info)}
                        className="flex min-w-0 flex-1 items-start gap-3 text-left active:opacity-80"
                      >
                        {thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            className="size-12 shrink-0 rounded-lg border border-line bg-surface-2 object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="grid size-12 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-[10px] text-faint">
                            —
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{name}</p>
                          <p className="text-xs text-muted">{info.category.name}</p>
                          {desc && <p className="mt-1 line-clamp-2 text-xs text-faint">{desc}</p>}
                          {equipment.length > 0 && (
                            <p className="label-mono mt-1 text-[9px] text-faint">
                              {equipment.join(' · ')}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="mt-1 size-4 shrink-0 text-faint" />
                      </button>
                    </div>
                  </li>
                )
              })}

              {!loading && !error && nextOffset != null && (
                <li ref={sentinelRef} className="flex items-center justify-center gap-2 py-4 text-sm text-muted">
                  {loadingMore && <Loader2 className="size-4 animate-spin" />}
                  {loadingMore ? 'Meer laden…' : null}
                </li>
              )}
            </ul>
          </>
        )}

        <footer className="border-t border-line p-4">
          <LabActionButton
            variant="primary"
            onClick={() => void handleImportSelected()}
            disabled={selected.size === 0 || importing}
            className="w-full"
          >
            {importing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Vertalen & importeren…
              </span>
            ) : (
              <>Importeer {selected.size > 0 ? `${selected.size} oefening(en)` : 'selectie'} als workout</>
            )}
          </LabActionButton>
        </footer>
      </div>
    </div>
  )
}
