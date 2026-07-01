import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'

type PageBackButtonProps = {
  to?: string
  label?: string
  className?: string
}

/** Prominent, touch-friendly back control for sub-pages. */
export function PageBackButton({ to, label, className }: PageBackButtonProps) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className={cn(
        'flex min-h-11 min-w-11 items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 text-sm font-medium text-fg active:bg-surface-3',
        className,
      )}
      aria-label={label ?? 'Terug'}
    >
      <ArrowLeft className="size-5 shrink-0" strokeWidth={2.5} />
      {label && <span className="truncate">{label}</span>}
    </button>
  )
}
