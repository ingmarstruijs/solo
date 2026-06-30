import { useEffect, useState } from 'react'
import type { ExerciseVisual } from '@/lib/tv/exerciseMedia'
import { cn } from '@/lib/cn'

export function TvExerciseVisual({ visual }: { visual: ExerciseVisual }) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(visual.displayImageUrl) && !imageFailed

  useEffect(() => {
    setImageFailed(false)
  }, [visual.displayImageUrl])

  return (
    <div
      className={cn(
        'relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden rounded-[2vh] border border-line',
        visual.loopClass,
      )}
      style={{ background: visual.gradient }}
    >
      {showImage ? (
        <img
          src={visual.displayImageUrl}
          alt={visual.title}
          loading="eager"
          className="absolute inset-0 h-full w-full object-contain p-[1.5vh]"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <ExerciseLoopSvg kind={visual.kind} />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/50 to-transparent p-[2vh]">
        <p className="text-[2.2vh] font-semibold">{visual.title}</p>
        <p className="text-[1.4vh] text-muted">{visual.subtitle}</p>
      </div>
    </div>
  )
}

function ExerciseLoopSvg({ kind }: { kind: ExerciseVisual['kind'] }) {
  const className = 'h-[45%] w-auto text-solo-300 opacity-90'

  if (kind === 'barbell') {
    return (
      <svg viewBox="0 0 120 80" className={cn(className, 'tv-anim-lift')} fill="none" stroke="currentColor" strokeWidth="3">
        <rect x="8" y="30" width="14" height="20" fill="currentColor" stroke="none" />
        <rect x="98" y="30" width="14" height="20" fill="currentColor" stroke="none" />
        <line x1="22" y1="40" x2="98" y2="40" />
      </svg>
    )
  }

  if (kind === 'dumbbell') {
    return (
      <svg viewBox="0 0 100 80" className={cn(className, 'tv-anim-lift')} fill="none" stroke="currentColor" strokeWidth="3">
        <rect x="10" y="32" width="12" height="16" fill="currentColor" stroke="none" />
        <rect x="78" y="32" width="12" height="16" fill="currentColor" stroke="none" />
        <line x1="22" y1="40" x2="78" y2="40" strokeWidth="5" />
      </svg>
    )
  }

  if (kind === 'cardio') {
    return (
      <svg viewBox="0 0 120 60" className={cn(className, 'tv-anim-pulse')} fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M10 40 L30 20 L50 35 L70 15 L90 30 L110 40" />
      </svg>
    )
  }

  if (kind === 'mobility') {
    return (
      <svg viewBox="0 0 80 80" className={cn(className, 'tv-anim-breathe')} fill="none" stroke="currentColor" strokeWidth="3">
        <circle cx="40" cy="40" r="24" />
        <path d="M40 16 L40 28 M40 52 L40 64 M16 40 L28 40 M52 40 L64 40" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 64 80" className={cn(className, 'tv-anim-lift')} fill="none" stroke="currentColor" strokeWidth="3">
      <circle cx="32" cy="14" r="8" />
      <line x1="32" y1="22" x2="32" y2="50" />
      <line x1="32" y1="32" x2="16" y2="44" />
      <line x1="32" y1="32" x2="48" y2="44" />
      <line x1="32" y1="50" x2="20" y2="72" />
      <line x1="32" y1="50" x2="44" y2="72" />
    </svg>
  )
}
