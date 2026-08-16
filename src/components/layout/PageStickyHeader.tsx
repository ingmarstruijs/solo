import { ArrowLeft, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from '@/i18n/hooks'
import { cn } from '@/lib/cn'

type PageStickyHeaderProps = {
  title: string
  onBack?: () => void
  backAriaLabel?: string
  actions?: ReactNode
  titleClassName?: string
}

export function PageStickyHeader({
  title,
  onBack,
  backAriaLabel,
  actions,
  titleClassName,
}: PageStickyHeaderProps) {
  const { t } = useTranslation('common')
  const aria = backAriaLabel ?? t('back')

  return (
    <header className="sticky top-[var(--header-h)] z-20 -mx-4 mb-3 flex items-center gap-2 border-b border-line bg-ink/90 px-4 py-2 backdrop-blur-md">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-surface-2 text-fg active:bg-surface-3"
          aria-label={aria}
        >
          <ArrowLeft className="size-5" strokeWidth={2.5} />
        </button>
      ) : (
        <span className="size-10 shrink-0" aria-hidden />
      )}

      <h1 className={cn('min-w-0 flex-1 truncate text-base font-bold', titleClassName)}>{title}</h1>

      {actions ? (
        <div className="flex shrink-0 items-center gap-1">{actions}</div>
      ) : (
        <span className="w-0 shrink-0" aria-hidden />
      )}
    </header>
  )
}

export function StickyHeaderIconButton({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  variant?: 'default' | 'primary'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'grid size-10 place-items-center rounded-xl border active:opacity-90',
        variant === 'primary'
          ? 'border-solo-400 bg-solo-400 text-ink'
          : 'border-line bg-surface-2 text-muted',
      )}
    >
      <Icon className="size-5" strokeWidth={variant === 'primary' ? 2.5 : 2} />
    </button>
  )
}
