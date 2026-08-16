import { cn } from '@/lib/cn'
import { useTranslation } from '@/i18n/hooks'

const RPE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

type RpePromptProps = {
  setNumber: number
  phaseLabel: string
  onSelect: (rpe: number) => void
  onSkip: () => void
  className?: string
}

/**
 * Optional RPE (1–10) capture after a set/round completes.
 * Sits above the rest overlay so logging does not block the workout.
 */
export function RpePrompt({ setNumber, phaseLabel, onSelect, onSkip, className }: RpePromptProps) {
  const { t } = useTranslation('session')

  return (
    <div
      className={cn(
        'fixed inset-0 z-[60] flex flex-col bg-ink/95 backdrop-blur-sm',
        'pt-[max(1rem,env(safe-area-inset-top))]',
        'pb-[max(1rem,env(safe-area-inset-bottom))]',
        className,
      )}
      role="dialog"
      aria-modal="true"
      aria-label={t('rpeAria')}
    >
      <div className="mx-auto flex w-full max-w-screen-sm flex-1 flex-col px-5">
        <header className="shrink-0 pt-2 text-center">
          <p className="label-mono text-[11px] uppercase tracking-wider text-solo-300">
            {t('rpeTitle')}
          </p>
          <p className="mt-1 text-sm text-muted">
            {t('rpeSubtitle', { phase: phaseLabel.toLowerCase(), number: setNumber })}
          </p>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center gap-5">
          <p className="text-center text-sm text-muted">{t('rpeHint')}</p>

          <div className="grid w-full max-w-sm grid-cols-5 gap-2" role="group" aria-label={t('rpeAria')}>
            {RPE_VALUES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onSelect(value)}
                className={cn(
                  'min-h-12 rounded-xl border border-line bg-surface-2 font-mono text-lg font-bold tabular-nums text-fg',
                  'active:border-solo-400/50 active:bg-solo-400/15 active:text-solo-300',
                )}
              >
                {value}
              </button>
            ))}
          </div>

          <div className="flex w-full max-w-sm justify-between text-[10px] text-faint">
            <span>{t('rpeEasy')}</span>
            <span>{t('rpeMax')}</span>
          </div>
        </div>

        <div className="shrink-0 pb-2 pt-4">
          <button
            type="button"
            onClick={onSkip}
            className="min-h-12 w-full rounded-xl border border-line bg-surface-2 px-5 text-sm font-semibold text-solo-400 active:bg-surface-3"
          >
            {t('rpeSkip')}
          </button>
        </div>
      </div>
    </div>
  )
}
