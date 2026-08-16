import { cn } from '@/lib/cn'
import { useTranslation } from '@/i18n/hooks'

function recoveryToneKey(score: number): 'toneFresh' | 'toneOk' | 'toneTired' {
  if (score >= 75) return 'toneFresh'
  if (score >= 50) return 'toneOk'
  return 'toneTired'
}

function recoveryToneColor(score: number): string {
  if (score >= 75) return 'var(--color-solo-400)'
  if (score >= 50) return '#eab308'
  return '#ef4444'
}

type RecoverySliderProps = {
  score: number
  onChange: (score: number) => void
  /** Compact layout for denser panels (prep insights). */
  compact?: boolean
  className?: string
  id?: string
}

/** Manual recovery input until Apple Health / Health Connect is available. */
export function RecoverySlider({
  score,
  onChange,
  compact = false,
  className,
  id = 'recovery-score',
}: RecoverySliderProps) {
  const { t } = useTranslation('session')
  const toneKey = recoveryToneKey(score)
  const toneColor = recoveryToneColor(score)

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
          {t('recovery')}
        </label>
        <p className="tabular-nums">
          <span
            className={cn('font-bold', compact ? 'text-base' : 'text-lg')}
            style={{ color: toneColor }}
          >
            {score}
          </span>
          <span className="label-mono ml-1.5 text-[10px] text-faint">{t(toneKey)}</span>
        </p>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={score}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        aria-label={t('recoveryAria')}
        className="w-full accent-[var(--color-solo-400)]"
      />
      <p className={cn('text-faint', compact ? 'text-[10px]' : 'text-[11px]')}>{t('recoveryHint')}</p>
    </div>
  )
}
