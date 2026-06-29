import { Menu, Tv } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '@/components/Logo'

type AppHeaderProps = {
  onMenuClick: () => void
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="pt-safe fixed inset-x-0 top-0 z-30 border-b border-line bg-ink/80 backdrop-blur-md">
      <div className="flex h-[var(--header-h)] items-center justify-between px-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Menu openen"
          className="grid size-10 place-items-center rounded-xl text-fg transition-colors active:bg-surface-2"
        >
          <Menu className="size-6" />
        </button>

        <Logo size={24} />

        <button
          type="button"
          onClick={() => navigate('/tv')}
          aria-label="Verbind met TV"
          className="grid size-10 place-items-center rounded-xl text-muted transition-colors active:bg-surface-2"
        >
          <Tv className="size-6" />
        </button>
      </div>
    </header>
  )
}
