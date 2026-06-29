import { Boxes, Dumbbell, Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { LogoMark } from '@/components/Logo'

export function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-1">
        <p className="label-mono text-faint">Solo training. Zero noise.</p>
        <h1 className="text-2xl font-bold tracking-tight">
          Klaar om te trainen<span className="text-solo-400">.</span>
        </h1>
      </header>

      {/* Primary CTA */}
      <button
        type="button"
        onClick={() => navigate('/session')}
        className="relative flex items-center gap-4 overflow-hidden rounded-card border border-line bg-surface p-5 text-left transition-colors active:bg-surface-2"
      >
        <LogoMark size={56} className="shrink-0 opacity-90" />
        <div className="flex-1">
          <p className="text-lg font-semibold">Start een sessie</p>
          <p className="text-sm text-muted">Bouw je workout en train autonoom.</p>
        </div>
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-solo-400 text-ink">
          <Play className="size-6 translate-x-0.5 fill-ink" />
        </span>
      </button>

      {/* Quick access */}
      <div className="grid grid-cols-2 gap-3">
        <QuickCard
          icon={Dumbbell}
          label="Workouts"
          hint="Definieer of laad"
          onClick={() => navigate('/workouts')}
        />
        <QuickCard
          icon={Boxes}
          label="Home Locker"
          hint="Jouw materiaal"
          onClick={() => navigate('/locker')}
        />
      </div>
    </div>
  )
}

function QuickCard({
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  icon: typeof Dumbbell
  label: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 text-left transition-colors active:bg-surface-2"
    >
      <Icon className="size-7 text-solo-400" />
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
    </button>
  )
}
