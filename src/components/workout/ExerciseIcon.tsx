import type { ReactNode } from 'react'
import type { EquipmentCategory } from '@/types/locker'
import type { ExerciseKind, SetMetric } from '@/types/workout'
import { getEquipmentMeta } from '@/lib/locker/equipmentCatalog'
import { EquipmentIcon } from '@/components/locker/EquipmentIcon'
import { cn } from '@/lib/cn'

type ExerciseIconProps = {
  metric: SetMetric
  kind?: ExerciseKind
  equipment?: EquipmentCategory[]
  icon?: EquipmentCategory
  className?: string
  size?: number
}

/** Human-readable equipment list, e.g. "Dumbbell · Bank". */
export function equipmentSummary(equipment: EquipmentCategory[] = []): string | null {
  const labels = equipment
    .filter((c) => c !== 'other')
    .map((c) => getEquipmentMeta(c).labelNl)
  return labels.length > 0 ? labels.join(' · ') : null
}

/**
 * Icon for an exercise. Uses a custom icon when set, otherwise shows locker
 * equipment icons or falls back to a schematic strength / cardio / mobility icon.
 */
export function ExerciseIcon({ metric, kind, equipment, icon, className, size = 40 }: ExerciseIconProps) {
  if (icon) {
    return <EquipmentIcon category={icon} size={size} className={cn(EQUIP_COLOR, className)} />
  }

  const items = equipment?.filter((c) => c !== 'other') ?? []

  if (items.length > 1) {
    const iconSize = Math.round(size * 0.5)
    return (
      <div
        className={cn('grid grid-cols-2 place-items-center gap-px', className)}
        style={{ width: size, height: size }}
      >
        {items.slice(0, 4).map((cat) => (
          <EquipmentIcon key={cat} category={cat} size={iconSize} className={EQUIP_COLOR} />
        ))}
      </div>
    )
  }

  if (items.length === 1) {
    return <EquipmentIcon category={items[0]} size={size} className={cn(EQUIP_COLOR, className)} />
  }

  const resolved = kind ?? inferKind(metric)
  if (resolved === 'strength') {
    return <EquipmentIcon category="bodyweight" size={size} className={cn(EQUIP_COLOR, className)} />
  }

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn(ICON_COLORS[resolved], className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      aria-hidden
    >
      {resolved === 'cardio' ? CARDIO[metric] : resolved === 'mobility' ? MOBILITY : STRENGTH[metric]}
    </svg>
  )
}

const EQUIP_COLOR = 'text-solo-400'

const ICON_COLORS: Record<ExerciseKind, string> = {
  strength: 'text-solo-400',
  cardio: 'text-warn',
  mobility: 'text-calm',
}

function inferKind(metric: SetMetric): ExerciseKind {
  if (metric === 'distance' || metric === 'time') return 'cardio'
  return 'strength'
}

const STRENGTH: Record<SetMetric, ReactNode> = {
  reps: (
    <>
      <rect x="6" y="26" width="12" height="12" fill="currentColor" stroke="none" />
      <rect x="46" y="26" width="12" height="12" fill="currentColor" stroke="none" />
      <line x1="18" y1="32" x2="46" y2="32" />
    </>
  ),
  time: (
    <>
      <circle cx="32" cy="34" r="18" />
      <line x1="32" y1="34" x2="32" y2="22" />
      <line x1="32" y1="34" x2="42" y2="34" />
    </>
  ),
  distance: (
    <>
      <path d="M12 48 L22 28 L32 38 L42 20 L52 48" />
      <line x1="10" y1="48" x2="54" y2="48" />
    </>
  ),
}

const CARDIO: Record<SetMetric, ReactNode> = {
  reps: (
    <>
      <circle cx="20" cy="44" r="6" />
      <circle cx="44" cy="44" r="6" />
      <path d="M14 44 L26 20 L38 32 L50 16" />
    </>
  ),
  time: (
    <>
      <ellipse cx="32" cy="40" rx="14" ry="8" />
      <path d="M18 40 C24 28 40 28 46 40" />
      <line x1="32" y1="18" x2="32" y2="28" />
    </>
  ),
  distance: (
    <>
      <path d="M10 46 Q32 10 54 46" fill="none" />
      <circle cx="32" cy="46" r="4" fill="currentColor" stroke="none" />
      <text x="32" y="24" textAnchor="middle" fontSize="10" fill="currentColor" stroke="none">RUN</text>
    </>
  ),
}

const MOBILITY = (
  <>
    <path d="M20 48 Q32 12 44 48" />
    <line x1="32" y1="12" x2="32" y2="24" />
    <line x1="24" y1="36" x2="40" y2="36" />
  </>
)

export function metricLabel(metric: SetMetric, target: number): string {
  if (metric === 'reps') return `${target} reps`
  if (metric === 'time') return `${target}s`
  return `${target}m`
}
