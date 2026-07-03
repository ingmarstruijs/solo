import { cn } from '@/lib/cn'
import {
  formatRestSeconds,
  restCountdownSubtitle,
  restCountdownTitle,
  type RestCountdown,
} from '@/hooks/useRestCountdown'

type RestTimerBarProps = {
  countdown: RestCountdown
  onSkip: () => void
  className?: string
}

export function RestTimerBar({ countdown, onSkip, className }: RestTimerBarProps) {
  if (!countdown.active) return null

  const isPhaseRest = countdown.kind === 'phase'

  return (
    <section
      className={cn(
        'rounded-card border p-3',
        isPhaseRest
          ? 'border-solo-400/45 bg-solo-400/10'
          : 'border-calm/40 bg-calm/10',
        className,
      )}
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              'text-sm font-bold',
              isPhaseRest ? 'text-solo-300' : 'text-calm',
            )}
          >
            {restCountdownTitle(countdown)}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted">{restCountdownSubtitle(countdown)}</p>
        </div>
        <p
          className={cn(
            'font-mono text-3xl font-bold tabular-nums',
            isPhaseRest ? 'text-solo-300' : 'text-calm',
          )}
        >
          {formatRestSeconds(countdown.remaining)}
        </p>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-300',
            isPhaseRest ? 'bg-solo-400' : 'bg-calm',
          )}
          style={{ width: `${countdown.progress * 100}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted">
        <span>
          {countdown.remaining} / {countdown.total} seconden
        </span>
        <button
          type="button"
          onClick={onSkip}
          className="min-h-11 rounded-xl border border-line bg-surface-2 px-5 text-sm font-semibold text-solo-400 active:bg-surface-3"
        >
          Overslaan
        </button>
      </div>
    </section>
  )
}
