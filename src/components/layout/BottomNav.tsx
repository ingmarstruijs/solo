import { Play } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { bottomNav } from '@/config/nav'
import { cn } from '@/lib/cn'

export function BottomNav() {
  const navigate = useNavigate()
  const left = bottomNav.slice(0, 2)
  const right = bottomNav.slice(2, 4)

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink/90 backdrop-blur-md">
      <div className="relative grid h-[var(--bottomnav-h)] grid-cols-5 items-center">
        {left.map((item) => (
          <NavItemLink key={item.to} {...item} />
        ))}

        {/* Center elevated Start CTA */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => navigate('/session')}
            aria-label="Sessie starten"
            className="-mt-8 grid size-16 place-items-center rounded-full border-4 border-ink bg-solo-400 text-ink shadow-lg shadow-solo-600/30 transition-transform active:scale-95"
          >
            <Play className="size-7 translate-x-0.5 fill-ink" />
          </button>
        </div>

        {right.map((item) => (
          <NavItemLink key={item.to} {...item} />
        ))}
      </div>
    </nav>
  )
}

function NavItemLink({
  to,
  label,
  icon: Icon,
}: (typeof bottomNav)[number]) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex h-full flex-col items-center justify-center gap-1 transition-colors',
          isActive ? 'text-solo-400' : 'text-muted active:text-fg',
        )
      }
    >
      <Icon className="size-6" />
      <span className="text-[0.65rem] font-medium tracking-wide">{label}</span>
    </NavLink>
  )
}
