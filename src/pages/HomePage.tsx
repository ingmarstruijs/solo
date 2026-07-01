import {
  Boxes,
  ChevronRight,
  Clock,
  Flame,
  Play,
  TrendingUp,
  Watch,
} from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActiveSession } from '@/hooks/useActiveSession'
import { useGarminConnected } from '@/hooks/useGarminConnected'
import { useLocker } from '@/hooks/useLocker'
import { useRecoveryScore } from '@/hooks/useRecoveryScore'
import { useHistory } from '@/hooks/useHistory'
import { LockerProfileSwitcher } from '@/components/locker/LockerProfileSwitcher'
import { cn } from '@/lib/cn'

function greeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Goedemorgen'
  if (hour >= 12 && hour < 18) return 'Goedemiddag'
  if (hour >= 18 && hour < 23) return 'Goedenavond'
  return 'Goedenacht'
}

function recoveryTone(score: number) {
  if (score >= 75) return { label: 'Fris', color: 'var(--color-solo-400)' }
  if (score >= 50) return { label: 'Oké', color: '#eab308' }
  return { label: 'Moe', color: '#ef4444' }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days <= 0) return 'Vandaag'
  if (days === 1) return 'Gisteren'
  if (days < 7) return `${days} dagen geleden`
  const weeks = Math.floor(days / 7)
  return weeks === 1 ? '1 week geleden' : `${weeks} weken geleden`
}

export function HomePage() {
  const navigate = useNavigate()
  const { activeProfile } = useLocker()
  const { connected: garminConnected } = useGarminConnected()
  const { score: recoveryScore } = useRecoveryScore()
  const { session, active } = useActiveSession()
  const { history, stats } = useHistory()
  const recent = useMemo(() => history.slice(0, 3), [history])

  const hour = new Date().getHours()
  const tone = recoveryTone(recoveryScore)
  const ringCirc = 2 * Math.PI * 34
  const ringOffset = ringCirc * (1 - recoveryScore / 100)

  return (
    <div className="flex flex-col gap-5 py-2">
      <header className="flex flex-col gap-1">
        <p className="label-mono text-faint">{greeting(hour)}.</p>
        <h1 className="text-2xl font-bold tracking-tight">
          Klaar om te trainen<span className="text-solo-400">.</span>
        </h1>
      </header>

      {active && session && (
        <button
          type="button"
          onClick={() => navigate('/session')}
          className="flex items-center gap-3 rounded-card border border-solo-400/40 bg-solo-400/10 p-4 text-left active:bg-solo-400/15"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-solo-400 text-ink">
            <Play className="size-5 translate-x-0.5 fill-ink" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="label-mono text-[10px] text-solo-400">Sessie bezig</p>
            <p className="truncate font-semibold">{session.workout.name}</p>
            <p className="text-xs text-muted">Set {session.currentSet} · tik om te hervatten</p>
          </div>
          <ChevronRight className="size-5 text-faint" />
        </button>
      )}

      {garminConnected && (
        <section className="grid grid-cols-[auto_1fr] gap-4 rounded-card border border-line bg-surface p-4">
          <div className="relative grid size-20 place-items-center">
            <svg viewBox="0 0 80 80" className="size-20 -rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-line)" strokeWidth="7" />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke={tone.color}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={ringCirc}
                strokeDashoffset={ringOffset}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-lg font-bold tabular-nums">{recoveryScore}</span>
              <span className="label-mono text-[8px] text-faint">{tone.label}</span>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-2">
            <div className="flex items-center gap-2">
              <Watch className="size-4 text-solo-400" />
              <p className="text-sm font-semibold">Garmin recovery</p>
            </div>
            <p className="text-xs text-muted">
              {recoveryScore >= 75
                ? 'Je bent fris — goede dag voor een zware sessie.'
                : recoveryScore >= 50
                  ? 'Redelijk hersteld. Houd het volume in de gaten.'
                  : 'Beperkt hersteld. Overweeg een lichte sessie of rust.'}
            </p>
          </div>
        </section>
      )}

      <div className="grid grid-cols-3 gap-2">
        <StatCard icon={Flame} label="Deze week" value={String(stats.sessionsThisWeek)} />
        <StatCard icon={TrendingUp} label="Sessies" value={String(stats.totalSessions)} />
        <StatCard icon={Clock} label="Minuten" value={String(stats.totalMinutes)} />
      </div>

      <button
        type="button"
        onClick={() => navigate('/workouts')}
        className="relative flex items-center gap-4 overflow-hidden rounded-card border border-line bg-surface p-5 text-left active:bg-surface-2"
      >
        <div className="flex-1">
          <p className="text-lg font-semibold">Kies een workout</p>
          <p className="text-sm text-muted">Selecteer, prep en start je sessie.</p>
        </div>
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-solo-400 text-ink">
          <Play className="size-6 translate-x-0.5 fill-ink" />
        </span>
      </button>

      <section className="rounded-card border border-line bg-surface p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Boxes className="size-4 text-solo-400" />
            <p className="text-sm font-semibold">Actieve locker</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/locker')}
            className="text-xs text-muted active:text-fg"
          >
            Beheer
          </button>
        </div>
        <p className="mb-3 text-xs text-muted">
          Workout prep gebruikt het materiaal van de geselecteerde locker ({activeProfile.name}).
        </p>
        <LockerProfileSwitcher showHint={false} />
      </section>

      {recent.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Recent</p>
            <button
              type="button"
              onClick={() => navigate('/history')}
              className="text-xs text-muted active:text-fg"
            >
              Alles
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {recent.map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => navigate(`/history/${rec.id}`)}
                className="flex items-center gap-3 rounded-card border border-line bg-surface p-3 text-left active:bg-surface-2"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-solo-400">
                  <Flame className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{rec.workoutName}</p>
                  <p className="text-[11px] text-muted">
                    {rec.exerciseCount} oefeningen · {rec.durationMinutes} min
                  </p>
                </div>
                <span className="label-mono text-[10px] text-faint">
                  {relativeTime(rec.completedAt)}
                </span>
                <ChevronRight className="size-4 shrink-0 text-faint" />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Flame
  label: string
  value: string
}) {
  return (
    <div className={cn('rounded-card border border-line bg-surface p-3 text-center')}>
      <Icon className="mx-auto mb-1 size-4 text-solo-400" />
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="label-mono mt-0.5 text-[9px] text-faint">{label}</p>
    </div>
  )
}
