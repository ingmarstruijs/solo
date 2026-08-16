import { cn } from '@/lib/cn'
import {
  formatRestSeconds,
  restCountdownSubtitle,
  restCountdownTitle,
  restNextExerciseLabel,
  type RestCountdown,
} from '@/hooks/useRestCountdown'
import { useTranslation } from '@/i18n/hooks'

type RestTimerBarProps = {
  countdown: RestCountdown
  onSkip: () => void
  className?: string
}

/**
 * Full-screen rest overlay on the phone controller.
 * Shows rust / set rust countdown and the exercise coming next.
 */
export function RestTimerBar({ countdown, onSkip, className }: RestTimerBarProps) {
  const { t } = useTranslation('session')

  if (!countdown.active) return null

  const isPhaseRest = countdown.kind === 'phase'
  const accentText = isPhaseRest ? 'text-solo-300' : 'text-calm'
  const accentBar = isPhaseRest ? 'bg-solo-400' : 'bg-calm'
  const accentBorder = isPhaseRest ? 'border-solo-400/40' : 'border-calm/35'
  const accentBg = isPhaseRest ? 'bg-solo-400/12' : 'bg-calm/12'

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col bg-ink/95 backdrop-blur-sm',
        'pt-[max(1rem,env(safe-area-inset-top))]',
        'pb-[max(1rem,env(safe-area-inset-bottom))]',
        className,
      )}
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      aria-label={restCountdownTitle(countdown)}
    >
      <div className="mx-auto flex w-full max-w-screen-sm flex-1 flex-col px-5">
        <header className="shrink-0 pt-2 text-center">
          <p className={cn('label-mono text-[11px] uppercase tracking-wider', accentText)}>
            {restCountdownTitle(countdown)}
          </p>
          <p className="mt-1 text-sm text-muted">{restCountdownSubtitle(countdown)}</p>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <p
            className={cn(
              'font-mono text-[5.5rem] font-bold leading-none tabular-nums tracking-tight',
              accentText,
            )}
          >
            {formatRestSeconds(countdown.remaining)}
          </p>

          <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-2">
            <div
              className={cn('h-full rounded-full transition-[width] duration-300', accentBar)}
              style={{ width: `${countdown.progress * 100}%` }}
            />
          </div>

          <p className="text-xs text-muted">
            {t('restSeconds', { remaining: countdown.remaining, total: countdown.total })}
          </p>

          {countdown.nextExerciseName && (
            <div
              className={cn(
                'w-full max-w-sm rounded-2xl border px-5 py-4 text-center',
                accentBorder,
                accentBg,
              )}
            >
              <p className={cn('label-mono text-[10px] uppercase tracking-wider', accentText)}>
                {restNextExerciseLabel(countdown)}
              </p>
              <p className="mt-2 text-xl font-bold leading-tight text-fg">
                {countdown.nextExerciseName}
              </p>
              {countdown.nextExerciseTarget && (
                <p className="mt-1.5 text-sm text-muted">{countdown.nextExerciseTarget}</p>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 pb-2 pt-4">
          <button
            type="button"
            onClick={onSkip}
            className="min-h-12 w-full rounded-xl border border-line bg-surface-2 px-5 text-sm font-semibold text-solo-400 active:bg-surface-3"
          >
            {t('skip')}
          </button>
        </div>
      </div>
    </div>
  )
}
