import type { PlateConfig } from '@/types/workout'
import { cn } from '@/lib/cn'

type WeightAssistantProps = {
  exerciseName: string
  config: PlateConfig
  className?: string
}

/** Brutalist vector plate configuration using actual locker inventory. */
export function WeightAssistant({ exerciseName, config, className }: WeightAssistantProps) {
  return (
    <div className={cn('rounded-xl border border-line bg-surface-2 p-3', className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="truncate text-xs font-semibold">{exerciseName}</p>
        <p className="shrink-0 font-mono text-sm font-bold tabular-nums text-solo-300">
          {config.totalKg > 0 ? `${config.totalKg} kg` : 'Lichaamsgewicht'}
        </p>
      </div>

      {config.mode === 'barbell' && <BarbellDiagram config={config} />}
      {config.mode === 'dumbbell' && <DumbbellDiagram config={config} />}
      {config.mode === 'kettlebell' && <KettlebellDiagram config={config} />}
      {config.mode === 'bodyweight' && (
        <p className="text-center text-xs text-muted">Lichaamsgewicht — geen gewicht nodig</p>
      )}

      {config.itemsUsed.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {config.itemsUsed.map((item) => (
            <li
              key={`${item.label}-${item.weightKg}`}
              className="rounded-md border border-line bg-surface px-2 py-0.5 font-mono text-[10px] text-muted"
            >
              {item.count > 1 ? `${item.count}× ` : ''}
              {item.label}
              {item.weightKg > 0 && ` (${item.weightKg} kg)`}
            </li>
          ))}
        </ul>
      )}

      {config.note && <p className="mt-2 text-[10px] text-warn">{config.note}</p>}
    </div>
  )
}

function BarbellDiagram({ config }: { config: PlateConfig }) {
  const left = [...config.platesPerSide].reverse()
  const right = config.platesPerSide

  return (
    <div className="flex flex-col gap-2">
      <svg viewBox="0 0 320 80" className="w-full text-solo-400" aria-label="Barbell plate configuratie">
        <rect x="8" y="30" width="12" height="20" fill="currentColor" opacity="0.8" />
        {left.map((w, i) => (
          <PlateRect key={`l-${i}`} x={22 + i * 14} weight={w} side="left" />
        ))}
        <line x1="20" y1="40" x2="300" y2="40" stroke="currentColor" strokeWidth="4" />
        {right.map((w, i) => (
          <PlateRect key={`r-${i}`} x={298 - (i + 1) * 14} weight={w} side="right" />
        ))}
        <rect x="300" y="30" width="12" height="20" fill="currentColor" opacity="0.8" />
      </svg>
      <div className="flex justify-between font-mono text-[10px] text-muted">
        <span>Stang {config.barWeightKg} kg</span>
        <span>
          {config.platesPerSide.length > 0
            ? `Per kant: ${config.platesPerSide.join(' + ')} kg`
            : 'Geen schijven'}
        </span>
      </div>
    </div>
  )
}

function PlateRect({ x, weight, side }: { x: number; weight: number; side: 'left' | 'right' }) {
  const h = Math.min(50, 20 + weight * 0.8)
  const y = 40 - h / 2
  return (
    <g>
      <rect
        x={x}
        y={y}
        width="10"
        height={h}
        fill="currentColor"
        opacity={side === 'left' ? 0.5 : 0.7}
        stroke="currentColor"
        strokeWidth="1"
      />
      <text
        x={x + 5}
        y={78}
        textAnchor="middle"
        className="fill-fg"
        fontSize="8"
        fontFamily="monospace"
      >
        {weight}
      </text>
    </g>
  )
}

function DumbbellDiagram({ config }: { config: PlateConfig }) {
  const item = config.itemsUsed[0]
  const label = item ? item.label : `${config.targetKg} kg`
  return (
    <svg viewBox="0 0 200 60" className="w-full text-solo-400" aria-label="Dumbbell configuratie">
      <rect x="10" y="20" width="20" height="20" fill="currentColor" />
      <line x1="30" y1="30" x2="170" y2="30" stroke="currentColor" strokeWidth="3" />
      <rect x="170" y="20" width="20" height="20" fill="currentColor" />
      <text x="100" y="55" textAnchor="middle" className="fill-fg" fontSize="10" fontFamily="monospace">
        {label} per hand
      </text>
    </svg>
  )
}

function KettlebellDiagram({ config }: { config: PlateConfig }) {
  const item = config.itemsUsed[0]
  const label = item ? item.label : `${config.targetKg} kg`
  return (
    <svg viewBox="0 0 80 80" className="mx-auto w-20 text-solo-400" aria-label="Kettlebell">
      <path d="M30 18 C30 12 50 12 50 18" fill="none" stroke="currentColor" strokeWidth="2" />
      <ellipse cx="40" cy="48" rx="22" ry="24" fill="none" stroke="currentColor" strokeWidth="3" />
      <line x1="40" y1="18" x2="40" y2="28" stroke="currentColor" strokeWidth="2" />
      <text x="40" y="52" textAnchor="middle" className="fill-fg" fontSize="10" fontFamily="monospace">
        {label}
      </text>
    </svg>
  )
}

type WeightAssistantListProps = {
  items: { exerciseName: string; config: PlateConfig }[]
}

export function WeightAssistantList({ items }: WeightAssistantListProps) {
  const weighted = items.filter((i) => i.config.targetKg > 0)
  if (weighted.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {weighted.map((item) => (
        <WeightAssistant
          key={item.exerciseName}
          exerciseName={item.exerciseName}
          config={item.config}
        />
      ))}
    </div>
  )
}
