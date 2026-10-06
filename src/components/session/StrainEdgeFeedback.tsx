import { cn } from '@/lib/cn'

type StrainEdgeFeedbackProps = {
  active: boolean
  className?: string
}

/**
 * Calm edge pulse while HR strain is active.
 * Visual-only; does not block interaction.
 */
export function StrainEdgeFeedback({ active, className }: StrainEdgeFeedbackProps) {
  if (!active) return null

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none fixed inset-0 z-40 border-[3px] border-warn/70',
        'animate-[strain-pulse_2.4s_ease-in-out_infinite]',
        className,
      )}
    />
  )
}
