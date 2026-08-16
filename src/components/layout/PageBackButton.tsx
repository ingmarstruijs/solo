import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useTranslation } from '@/i18n/hooks'
import { cn } from '@/lib/cn'

type PageBackButtonProps = {
  to?: string
  label?: string
  className?: string
  onClick?: () => void
}

/** Prominent, touch-friendly back control for sub-pages. */
export function PageBackButton({ to, label, className, onClick }: PageBackButtonProps) {
  const navigate = useNavigate()
  const { t } = useTranslation('common')

  return (
    <button
      type="button"
      onClick={() => (onClick ? onClick() : to ? navigate(to) : navigate(-1))}
      className={cn(
        'flex min-h-11 min-w-11 items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 text-sm font-medium text-fg active:bg-surface-3',
        className,
      )}
      aria-label={label ?? t('back')}
    >
      <ArrowLeft className="size-5 shrink-0" strokeWidth={2.5} />
      {label && <span className="truncate">{label}</span>}
    </button>
  )
}
