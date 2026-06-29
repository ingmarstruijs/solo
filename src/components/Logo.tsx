import { cn } from '@/lib/cn'

type LogoMarkProps = {
  /** Pixel size of the square mark. */
  size?: number
  className?: string
  title?: string
}

/**
 * SOLO. mark — a minimalist pose-landmark figure (arms raised, mid-rep),
 * echoing the MediaPipe skeleton. Limbs use currentColor, joints use the accent.
 */
export function LogoMark({ size = 32, className, title = 'SOLO.' }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label={title}
      className={cn('text-solo-400', className)}
    >
      <g
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* head */}
        <circle cx="32" cy="13" r="6" />
        {/* neck + spine */}
        <path d="M32 19 V42" />
        {/* shoulders */}
        <path d="M20 30 H44" />
        {/* raised arms */}
        <path d="M20 30 L13 18" />
        <path d="M44 30 L51 18" />
        {/* legs */}
        <path d="M32 42 L23 57" />
        <path d="M32 42 L41 57" />
      </g>
      {/* joints / landmarks */}
      <g fill="var(--color-accent)">
        <circle cx="13" cy="18" r="2.8" />
        <circle cx="51" cy="18" r="2.8" />
        <circle cx="20" cy="30" r="2.8" />
        <circle cx="44" cy="30" r="2.8" />
        <circle cx="32" cy="42" r="2.8" />
        <circle cx="23" cy="57" r="2.8" />
        <circle cx="41" cy="57" r="2.8" />
      </g>
    </svg>
  )
}

type LogoProps = {
  size?: number
  withWordmark?: boolean
  className?: string
}

/** Full SOLO. lockup: mark + wordmark with the signature pastel-blue period. */
export function Logo({ size = 28, withWordmark = true, className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark size={size} />
      {withWordmark && (
        <span className="font-mono text-lg font-bold leading-none tracking-tight text-fg">
          SOLO<span className="text-solo-400">.</span>
        </span>
      )}
    </span>
  )
}
