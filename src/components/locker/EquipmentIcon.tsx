import type { ReactNode } from 'react'
import type { EquipmentCategory } from '@/types/locker'
import { cn } from '@/lib/cn'

type EquipmentIconProps = {
  category: EquipmentCategory
  className?: string
  size?: number
}

/** Brutalist vector schematic icons for locker equipment. */
export function EquipmentIcon({ category, className, size = 48 }: EquipmentIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn('text-solo-400', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      aria-hidden
    >
      {ICONS[category]}
    </svg>
  )
}

const ICONS: Record<EquipmentCategory, ReactNode> = {
  dumbbell: (
    <>
      <rect x="4" y="26" width="10" height="12" fill="currentColor" stroke="none" />
      <rect x="50" y="26" width="10" height="12" fill="currentColor" stroke="none" />
      <line x1="14" y1="32" x2="50" y2="32" />
    </>
  ),
  kettlebell: (
    <>
      <path d="M28 14 C28 10 36 10 36 14" />
      <ellipse cx="32" cy="38" rx="16" ry="18" />
      <line x1="32" y1="14" x2="32" y2="22" />
    </>
  ),
  medicine_ball: (
    <>
      <circle cx="32" cy="34" r="20" />
      <line x1="20" y1="24" x2="44" y2="44" />
      <line x1="44" y1="24" x2="20" y2="44" />
    </>
  ),
  resistance_band: (
    <>
      <path d="M12 48 Q32 8 52 48" />
      <line x1="12" y1="48" x2="8" y2="52" />
      <line x1="52" y1="48" x2="56" y2="52" />
    </>
  ),
  barbell: (
    <>
      <rect x="2" y="24" width="8" height="16" fill="currentColor" stroke="none" />
      <rect x="54" y="24" width="8" height="16" fill="currentColor" stroke="none" />
      <rect x="10" y="28" width="6" height="8" fill="currentColor" stroke="none" opacity="0.5" />
      <rect x="48" y="28" width="6" height="8" fill="currentColor" stroke="none" opacity="0.5" />
      <line x1="16" y1="32" x2="48" y2="32" />
    </>
  ),
  weight_plate: (
    <>
      <circle cx="32" cy="32" r="22" />
      <circle cx="32" cy="32" r="8" />
      <line x1="32" y1="10" x2="32" y2="24" />
      <line x1="32" y1="40" x2="32" y2="54" />
    </>
  ),
  pull_up_bar: (
    <>
      <line x1="8" y1="48" x2="8" y2="16" />
      <line x1="56" y1="48" x2="56" y2="16" />
      <line x1="8" y1="16" x2="56" y2="16" />
      <line x1="8" y1="48" x2="56" y2="48" />
    </>
  ),
  bench: (
    <>
      <line x1="8" y1="40" x2="56" y2="40" />
      <line x1="12" y1="40" x2="12" y2="52" />
      <line x1="52" y1="40" x2="52" y2="52" />
      <line x1="48" y1="40" x2="60" y2="28" />
      <line x1="60" y1="28" x2="60" y2="52" />
    </>
  ),
  rower: (
    <>
      <rect x="8" y="36" width="48" height="8" />
      <line x1="16" y1="36" x2="16" y2="20" />
      <line x1="16" y1="20" x2="28" y2="20" />
      <ellipse cx="48" cy="44" rx="8" ry="8" />
    </>
  ),
  cable: (
    <>
      <line x1="32" y1="8" x2="32" y2="20" />
      <rect x="20" y="20" width="24" height="32" />
      <line x1="32" y1="52" x2="32" y2="58" />
      <rect x="26" y="56" width="12" height="4" fill="currentColor" stroke="none" />
    </>
  ),
  foam_roller: (
    <>
      <rect x="10" y="28" width="44" height="12" rx="6" />
      <line x1="18" y1="28" x2="18" y2="40" opacity="0.4" />
      <line x1="28" y1="28" x2="28" y2="40" opacity="0.4" />
      <line x1="38" y1="28" x2="38" y2="40" opacity="0.4" />
    </>
  ),
  jump_rope: (
    <>
      <path d="M16 48 C16 20 48 20 48 48" />
      <line x1="16" y1="48" x2="12" y2="52" />
      <line x1="48" y1="48" x2="52" y2="52" />
    </>
  ),
  bodyweight: (
    <>
      <circle cx="32" cy="12" r="7" />
      <line x1="32" y1="19" x2="32" y2="42" />
      <line x1="32" y1="28" x2="18" y2="38" />
      <line x1="32" y1="28" x2="46" y2="38" />
      <line x1="32" y1="42" x2="22" y2="58" />
      <line x1="32" y1="42" x2="42" y2="58" />
    </>
  ),
  other: (
    <>
      <rect x="16" y="16" width="32" height="32" />
      <line x1="24" y1="28" x2="40" y2="28" />
      <line x1="24" y1="36" x2="40" y2="36" />
    </>
  ),
}
