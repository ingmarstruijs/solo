import { Minus, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'

export type TouchNumberPreset = 'rest' | 'weight' | 'reps' | 'sets' | 'distance' | 'generic'

type TouchNumberFieldProps = {
  label: string
  hint?: string
  value: number
  min?: number
  max?: number
  step?: number
  preset?: TouchNumberPreset
  disabled?: boolean
  onChange: (value: number) => void
  className?: string
}

function smartStep(value: number, preset: TouchNumberPreset, baseStep?: number): number {
  if (baseStep != null) return baseStep

  switch (preset) {
    case 'rest':
      if (value >= 120) return 30
      if (value >= 60) return 15
      if (value >= 30) return 5
      return 1
    case 'weight':
      if (value >= 50) return 5
      if (value >= 20) return 2.5
      return 0.5
    case 'reps':
      if (value >= 30) return 5
      if (value >= 15) return 2
      return 1
    case 'distance':
      if (value >= 500) return 100
      if (value >= 100) return 50
      if (value >= 20) return 10
      return 5
    case 'sets':
      return 1
    default:
      if (value >= 100) return 10
      if (value >= 20) return 5
      return 1
  }
}

function clamp(value: number, min?: number, max?: number): number {
  let next = value
  if (min != null) next = Math.max(min, next)
  if (max != null) next = Math.min(max, next)
  return next
}

function roundStep(value: number, step: number): number {
  if (step >= 1) return Math.round(value)
  const decimals = String(step).includes('.') ? String(step).split('.')[1]?.length ?? 1 : 0
  return Number(value.toFixed(decimals))
}

export function TouchNumberField({
  label,
  hint,
  value,
  min = 0,
  max,
  step,
  preset = 'generic',
  disabled,
  onChange,
  className,
}: TouchNumberFieldProps) {
  const [text, setText] = useState(String(value))
  const isDecimal = preset === 'weight' || (step != null && step < 1)

  useEffect(() => {
    setText(String(value))
  }, [value])

  function commit(raw: string) {
    if (raw.trim() === '') {
      onChange(min)
      setText(String(min))
      return
    }
    const parsed = isDecimal ? parseFloat(raw) : parseInt(raw, 10)
    if (Number.isNaN(parsed)) {
      setText(String(value))
      return
    }
    const next = clamp(parsed, min, max)
    onChange(next)
    setText(String(next))
  }

  function adjust(direction: 1 | -1) {
    const delta = smartStep(value, preset, step)
    const raw = value + direction * delta
    const next = clamp(roundStep(raw, delta), min, max)
    onChange(next)
    setText(String(next))
  }

  return (
    <label className={cn('flex flex-col gap-1', className)}>
      <span className="label-mono text-[9px] text-faint">{label}</span>
      <div
        className={cn(
          'flex items-stretch overflow-hidden rounded-xl border border-line bg-surface-2',
          disabled && 'opacity-50',
        )}
      >
        <button
          type="button"
          disabled={disabled || value <= min}
          onClick={() => adjust(-1)}
          className="grid min-h-11 w-11 shrink-0 place-items-center border-r border-line text-muted active:bg-surface-3 disabled:opacity-30"
          aria-label={`${label} verlagen`}
        >
          <Minus className="size-5" strokeWidth={2.5} />
        </button>
        <input
          type="number"
          inputMode={isDecimal ? 'decimal' : 'numeric'}
          min={min}
          max={max}
          step={step ?? smartStep(value, preset)}
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => commit(text)}
          className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-center text-base font-semibold tabular-nums text-fg outline-none"
        />
        <button
          type="button"
          disabled={disabled || (max != null && value >= max)}
          onClick={() => adjust(1)}
          className="grid min-h-11 w-11 shrink-0 place-items-center border-l border-line text-muted active:bg-surface-3 disabled:opacity-30"
          aria-label={`${label} verhogen`}
        >
          <Plus className="size-5" strokeWidth={2.5} />
        </button>
      </div>
      {hint && <span className="text-[9px] text-faint">{hint}</span>}
    </label>
  )
}
