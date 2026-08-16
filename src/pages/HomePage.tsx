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
import { useNavigate } from 'react-router'
import { useActiveSession } from '@/hooks/useActiveSession'
import { useGarminConnected } from '@/hooks/useGarminConnected'
import { useLocker } from '@/hooks/useLocker'
import { useRecoveryScore } from '@/hooks/useRecoveryScore'
import { useHistory } from '@/hooks/useHistory'
import { LockerProfileSwitcher } from '@/components/locker/LockerProfileSwitcher'
import { RecoverySlider } from '@/components/workout/RecoverySlider'
import { useTranslation } from '@/i18n/hooks'
import { cn } from '@/lib/cn'

function greetingKey(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 23) return 'evening'
  return 'night'
}

function recoveryToneKey(score: number): 'toneFresh' | 'toneOk' | 'toneTired' {
  if (score >= 75) return 'toneFresh'
  if (score >= 50) return 'toneOk'
  return 'toneTired'
}

function recoveryToneColor(score: number): string {
  if (score >= 75) return 'var(--color-solo-400)'
  if (score >= 50) return '#eab308'
  return '#ef4444'
}

export function HomePage() {
  const { t } = useTranslation('home')
  const navigate = useNavigate()
  const { activeProfile } = useLocker()
  const { connected: garminConnected } = useGarminConnected()
  const { score: recoveryScore, setScore: setRecoveryScore } = useRecoveryScore()
  const { session, active } = useActiveSession()
  const { history, stats } = useHistory()
  const recent = useMemo(() => history.slice(0, 3), [history])

  const hour = new Date().getHours()
  const toneKey = recoveryToneKey(recoveryScore)
  const toneColor = recoveryToneColor(recoveryScore)
  const ringCirc = 2 * Math.PI * 34
  const ringOffset = ringCirc * (1 - recoveryScore / 100)

  const liveSession =
    active &&
    session &&
    (session.exercisesStarted ?? Boolean(session.currentExerciseStartedAt))

  function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const days = Math.floor(diff / 86_400_000)
    if (days <= 0) return t('relative.today')
    if (days === 1) return t('relative.yesterday')
    if (days < 7) return t('relative.daysAgo', { count: days })
    const weeks = Math.floor(days / 7)
    return weeks === 1 ? t('relative.weekAgo') : t('relative.weeksAgo', { count: weeks })
  }

  return (
    <div className="flex flex-col gap-5 py-2">
      <header className="flex flex-col gap-1">
        <p className="label-mono text-faint">{t(`greeting.${greetingKey(hour)}`)}.</p>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('hero')}
          <span className="text-solo-400">.</span>
        </h1>
      </header>

      {liveSession && (
        <button
          type="button"
          onClick={() => navigate('/session')}
          className="flex items-center gap-3 rounded-card border border-solo-400/40 bg-solo-400/10 p-4 text-left active:bg-solo-400/15"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-solo-400 text-ink">
            <Play className="size-5 translate-x-0.5 fill-ink" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="label-mono text-[10px] text-solo-400">{t('sessionLive')}</p>
            <p className="truncate font-semibold">{session.workout.name}</p>
            <p className="text-xs text-muted">{t('resumeSet', { set: session.currentSet })}</p>
          </div>
          <ChevronRight className="size-5 text-faint" />
        </button>
      )}

      {garminConnected && (
        <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4">
          <div className="grid grid-cols-[auto_1fr] gap-4">
            <div className="relative grid size-20 place-items-center">
              <svg viewBox="0 0 80 80" className="size-20 -rotate-90">
                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-line)" strokeWidth="7" />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke={toneColor}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={ringCirc}
                  strokeDashoffset={ringOffset}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-lg font-bold tabular-nums">{recoveryScore}</span>
                <span className="label-mono text-[8px] text-faint">{t(toneKey)}</span>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-2">
              <div className="flex items-center gap-2">
                <Watch className="size-4 text-solo-400" />
                <p className="text-sm font-semibold">{t('recovery')}</p>
              </div>
              <p className="text-xs text-muted">
                {recoveryScore >= 75
                  ? t('recoveryFresh')
                  : recoveryScore >= 50
                    ? t('recoveryOk')
                    : t('recoveryTired')}
              </p>
            </div>
          </div>
          <RecoverySlider
            id="home-recovery-score"
            score={recoveryScore}
            onChange={setRecoveryScore}
          />
        </section>
      )}

      <div className="grid grid-cols-3 gap-2">
        <StatCard icon={Flame} label={t('thisWeek')} value={String(stats.sessionsThisWeek)} />
        <StatCard icon={TrendingUp} label={t('sessions')} value={String(stats.totalSessions)} />
        <StatCard icon={Clock} label={t('minutes')} value={String(stats.totalMinutes)} />
      </div>

      <button
        type="button"
        onClick={() => navigate('/workouts')}
        className="relative flex items-center gap-4 overflow-hidden rounded-card border border-line bg-surface p-5 text-left active:bg-surface-2"
      >
        <div className="flex-1">
          <p className="text-lg font-semibold">{t('chooseWorkout')}</p>
          <p className="text-sm text-muted">{t('chooseWorkoutHint')}</p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-faint" />
      </button>

      <section className="rounded-card border border-line bg-surface p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Boxes className="size-4 text-solo-400" />
            <p className="text-sm font-semibold">{t('activeLocker')}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/locker')}
            className="text-xs text-muted active:text-fg"
          >
            {t('manage')}
          </button>
        </div>
        <p className="mb-3 text-xs text-muted">{t('lockerHint', { name: activeProfile.name })}</p>
        <LockerProfileSwitcher showHint={false} />
      </section>

      {recent.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{t('recent')}</p>
            <button
              type="button"
              onClick={() => navigate('/history')}
              className="text-xs text-muted active:text-fg"
            >
              {t('seeAll')}
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
                    {t('recentMeta', { count: rec.exerciseCount, minutes: rec.durationMinutes })}
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
