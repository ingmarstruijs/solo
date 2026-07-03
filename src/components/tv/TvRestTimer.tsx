import { formatRestSeconds, restCountdownSubtitle, restCountdownTitle, useRestCountdown } from '@/hooks/useRestCountdown'
import type { TvRestState } from '@/lib/tv/broadcast'
import { cn } from '@/lib/cn'

export function TvRestTimer({ rest }: { rest: TvRestState | null | undefined }) {
  const timer =
    rest?.active && rest.endsAt
      ? {
          id: 'tv-rest',
          endsAt: new Date(rest.endsAt).getTime(),
          totalSeconds: rest.totalSeconds,
          afterExerciseName: rest.afterExerciseName ?? '',
          kind: rest.kind ?? 'exercise',
          phaseLabel: rest.phaseLabel,
          completedPhase: rest.completedPhase,
        }
      : null

  const countdown = useRestCountdown(timer)
  if (!countdown.active) return null

  const isPhaseRest = countdown.kind === 'phase'

  return (
    <section
      className={cn(
        'shrink-0 rounded-[1.5vh] border p-[2vh]',
        isPhaseRest ? 'border-solo-400/45 bg-solo-400/10' : 'border-calm/40 bg-calm/10',
      )}
    >
      <div className="flex items-center justify-between gap-[2vh]">
        <div className="min-w-0">
          <p className={cn('text-[2vh] font-bold', isPhaseRest ? 'text-solo-300' : 'text-calm')}>
            {restCountdownTitle(countdown)}
          </p>
          <p className="mt-[0.5vh] truncate text-[1.6vh] text-muted">
            {restCountdownSubtitle(countdown)}
          </p>
        </div>
        <p
          className={cn(
            'font-mono text-[6vh] font-bold leading-none tabular-nums',
            isPhaseRest ? 'text-solo-300' : 'text-calm',
          )}
        >
          {formatRestSeconds(countdown.remaining)}
        </p>
      </div>
      <div className="mt-[1.5vh] h-[1vh] overflow-hidden rounded-full bg-surface-2">
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-300',
            isPhaseRest ? 'bg-solo-400' : 'bg-calm',
          )}
          style={{ width: `${countdown.progress * 100}%` }}
        />
      </div>
      <p className="mt-[1vh] text-[1.4vh] text-muted">
        {countdown.remaining} / {countdown.total} seconden
      </p>
    </section>
  )
}
