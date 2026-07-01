import { MoreHorizontal, Plus, Search } from 'lucide-react'
import { useRef, useState, type ChangeEvent, type ReactNode } from 'react'

type WorkoutCompactToolbarProps = {
  onNew: () => void
  onExport: () => void
  onImportJson: (json: string) => number
  onImportFit: (buffer: ArrayBuffer) => void
  onBrowseWger: () => void
}

export function WorkoutCompactToolbar({
  onNew,
  onExport,
  onImportJson,
  onImportFit,
  onBrowseWger,
}: WorkoutCompactToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const jsonRef = useRef<HTMLInputElement>(null)
  const fitRef = useRef<HTMLInputElement>(null)

  function handleJson(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const count = onImportJson(reader.result as string)
      alert(`${count} workout(s) geïmporteerd.`)
    }
    reader.readAsText(file)
    e.target.value = ''
    setMenuOpen(false)
  }

  function handleFit(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onImportFit(reader.result as ArrayBuffer)
    reader.readAsArrayBuffer(file)
    e.target.value = ''
    setMenuOpen(false)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onNew}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-solo-400 px-3 py-2.5 text-sm font-semibold text-ink active:bg-solo-500"
      >
        <Plus className="size-4" />
        Nieuw
      </button>

      <button
        type="button"
        onClick={onBrowseWger}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-solo-400/50 bg-solo-400/10 px-3 py-2.5 text-sm font-semibold text-solo-300 active:bg-solo-400/20"
      >
        <Search className="size-4" />
        Zoeken
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="grid size-10 place-items-center rounded-xl border border-line text-muted active:bg-surface-2"
          aria-label="Meer opties"
        >
          <MoreHorizontal className="size-4" />
        </button>

        {menuOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
              aria-label="Sluit menu"
            />
            <div className="absolute right-0 top-11 z-50 min-w-[10rem] rounded-xl border border-line bg-surface p-1 shadow-lg">
              <MenuItem onClick={() => { onExport(); setMenuOpen(false) }}>Export workouts</MenuItem>
              <MenuItem onClick={() => jsonRef.current?.click()}>Import workouts</MenuItem>
              <MenuItem onClick={() => fitRef.current?.click()}>Garmin FIT</MenuItem>
            </div>
          </>
        )}
      </div>

      <input ref={jsonRef} type="file" accept=".json" className="hidden" onChange={handleJson} />
      <input ref={fitRef} type="file" accept=".fit" className="hidden" onChange={handleFit} />
    </div>
  )
}

function MenuItem({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg px-3 py-2 text-left text-sm text-fg active:bg-surface-2"
    >
      {children}
    </button>
  )
}
