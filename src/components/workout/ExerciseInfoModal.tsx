import { X } from 'lucide-react'
import { useEffect } from 'react'
import type { WorkoutExercise } from '@/types/workout'
import { MarkdownText } from '@/components/MarkdownText'
import { ExerciseVisualMobile } from '@/components/workout/ExerciseVisualMobile'
import { useLocalizedExercise } from '@/hooks/useLocalizedExercise'
import { useTranslation } from '@/i18n/hooks'

type ExerciseInfoModalProps = {
  exercise: WorkoutExercise
  onClose: () => void
}

export function ExerciseInfoModal({ exercise, onClose }: ExerciseInfoModalProps) {
  const { t } = useTranslation(['session', 'common'])
  const { name, description } = useLocalizedExercise(exercise)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/85 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`${t('session:instructions')} ${name}`}
    >
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label={t('common:close')} />
      <div className="relative z-10 flex h-[92dvh] w-full max-w-screen-sm flex-col rounded-t-card border border-line bg-surface shadow-xl sm:h-[88dvh] sm:rounded-card">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <p className="label-mono text-faint">{t('common:exercise')}</p>
            <h2 className="truncate text-lg font-bold">{name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-11 shrink-0 place-items-center rounded-xl text-muted active:bg-surface-2"
            aria-label={t('common:close')}
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="shrink-0 p-3">
            <ExerciseVisualMobile exercise={exercise} />
          </div>

          {description ? (
            <div className="border-t border-line px-4 py-4">
              <p className="label-mono mb-2 text-faint">{t('session:instructions')}</p>
              <MarkdownText content={description} />
            </div>
          ) : (
            <p className="px-4 pb-4 text-sm text-muted">{t('session:noDescription')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
