import { Menu } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useTranslation } from '@/i18n/hooks'

type AppHeaderProps = {
  onMenuClick: () => void
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { t } = useTranslation('common')

  return (
    <header className="pt-safe fixed inset-x-0 top-0 z-30 border-b border-line bg-ink/80 backdrop-blur-md">
      <div className="flex h-[var(--header-h)] items-center justify-between px-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label={t('openMenu')}
          className="grid size-10 place-items-center rounded-xl text-fg transition-colors active:bg-surface-2"
        >
          <Menu className="size-6" />
        </button>

        <Logo size={24} />

        {/* Spacer for centered logo */}
        <div className="size-10" aria-hidden />
      </div>
    </header>
  )
}
