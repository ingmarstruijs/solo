import { X } from 'lucide-react'
import { useEffect } from 'react'
import { MarkdownText } from '@/components/MarkdownText'

type ExerciseInfoModalProps = {
  name: string
  description: string
  onClose: () => void
}

export function ExerciseInfoModal({ name, description, onClose }: ExerciseInfoModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Uitleg ${name}`}
    >
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Sluiten" />
      <div className="relative z-10 flex max-h-[85dvh] w-full max-w-screen-sm flex-col rounded-card border border-line bg-surface shadow-xl">
        <header className="flex items-center justify-between gap-3 border-b border-line p-4">
          <div className="min-w-0">
            <p className="label-mono text-faint">Uitleg</p>
            <h2 className="truncate text-lg font-bold">{name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-11 shrink-0 place-items-center rounded-xl text-muted active:bg-surface-2"
            aria-label="Sluiten"
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="overflow-y-auto p-4">
          <MarkdownText content={description} />
        </div>
      </div>
    </div>
  )
}
