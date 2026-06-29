import { useEffect } from 'react'
import { X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { drawerNav } from '@/config/nav'
import { cn } from '@/lib/cn'

type DrawerProps = {
  open: boolean
  onClose: () => void
}

export function Drawer({ open, onClose }: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div
      className={cn('fixed inset-0 z-50', open ? 'pointer-events-auto' : 'pointer-events-none')}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-black/60 transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigatie"
        className={cn(
          'pt-safe pb-safe absolute inset-y-0 left-0 flex w-[78%] max-w-80 flex-col border-r border-line bg-surface shadow-2xl transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-4">
          <Logo size={26} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Menu sluiten"
            className="grid size-9 place-items-center rounded-xl text-muted transition-colors active:bg-surface-2"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="flex flex-col gap-1">
            {drawerNav.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-surface-2 text-solo-400'
                        : 'text-fg active:bg-surface-2',
                    )
                  }
                >
                  <Icon className="size-5 shrink-0" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-line px-4 py-3">
          <p className="label-mono text-faint">Solo training. Zero noise.</p>
        </div>
      </aside>
    </div>
  )
}
