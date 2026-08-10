import { cn } from '@/lib/cn'

function recoveryTone(score: number) {
  if (score >= 75) return { label: 'Fris', color: 'var(--color-solo-400)' }
  if (score >= 50) return { label: 'Oké', color: '#eab308' }
  return { label: 'Moe', color: '#ef4444' }
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
  const tone = recoveryTone(score)

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
          Herstel
        </label>
        <p className="tabular-nums">
          <span
            className={cn('font-bold', compact ? 'text-base' : 'text-lg')}
            style={{ color: tone.color }}
          >
            {score}
          </span>
          <span className="label-mono ml-1.5 text-[10px] text-faint">{tone.label}</span>
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
        aria-label="Herstelscore"
        className="w-full accent-[var(--color-solo-400)]"
      />
      <p className={cn('text-faint', compact ? 'text-[10px]' : 'text-[11px]')}>
        Stel je herstel in (0–100). Onder 50 worden zware gewichten met 5–10% verlaagd.
      </p>
    </div>
  )
}
