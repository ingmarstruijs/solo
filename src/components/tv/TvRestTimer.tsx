import {
  formatRestSeconds,
  restCountdownSubtitle,
  restCountdownTitle,
  restNextExerciseLabel,
  useRestCountdown,
} from '@/hooks/useRestCountdown'
import type { TvRestState } from '@/lib/tv/broadcast'
import { cn } from '@/lib/cn'

/**
 * Full-bleed rest overlay on the TV receiver.
 * Covers the session HUD with rust / set rust and the upcoming exercise.
 */
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
          nextExerciseName: rest.nextExerciseName,
          nextExerciseTarget: rest.nextExerciseTarget,
        }
      : null

  const countdown = useRestCountdown(timer)
  if (!countdown.active) return null

  const isPhaseRest = countdown.kind === 'phase'
  const accentText = isPhaseRest ? 'text-solo-300' : 'text-calm'
  const accentBar = isPhaseRest ? 'bg-solo-400' : 'bg-calm'
  const accentBorder = isPhaseRest ? 'border-solo-400/40' : 'border-calm/35'
  const accentBg = isPhaseRest ? 'bg-solo-400/15' : 'bg-calm/15'

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col bg-ink/92 backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-label={restCountdownTitle(countdown)}
    >
      <div className="mx-auto flex h-full w-full max-w-[110rem] flex-col px-[4vh] py-[3vh]">
        <header className="shrink-0 text-center">
          <p className={cn('label-mono text-[1.8vh] uppercase tracking-[0.18em]', accentText)}>
            {restCountdownTitle(countdown)}
          </p>
          <p className="mt-[1vh] text-[2.2vh] text-muted">{restCountdownSubtitle(countdown)}</p>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center gap-[3vh]">
          <p
            className={cn(
              'font-mono text-[18vh] font-bold leading-none tabular-nums tracking-tight',
              accentText,
            )}
          >
            {formatRestSeconds(countdown.remaining)}
          </p>

          <div className="h-[1.2vh] w-[min(48vw,40rem)] overflow-hidden rounded-full bg-surface-2">
            <div
              className={cn('h-full rounded-full transition-[width] duration-300', accentBar)}
              style={{ width: `${countdown.progress * 100}%` }}
            />
          </div>

          <p className="text-[1.8vh] text-muted">
            {countdown.remaining} / {countdown.total} seconden
          </p>

          {countdown.nextExerciseName && (
            <div
              className={cn(
                'mt-[1vh] w-full max-w-[56rem] rounded-[2vh] border px-[4vh] py-[3vh] text-center',
                accentBorder,
                accentBg,
              )}
            >
              <p className={cn('label-mono text-[1.4vh] uppercase tracking-[0.16em]', accentText)}>
                {restNextExerciseLabel(countdown)}
              </p>
              <p className="mt-[1.2vh] text-[5vh] font-bold leading-tight text-fg">
                {countdown.nextExerciseName}
              </p>
              {countdown.nextExerciseTarget && (
                <p className="mt-[1vh] text-[2.4vh] text-muted">{countdown.nextExerciseTarget}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
