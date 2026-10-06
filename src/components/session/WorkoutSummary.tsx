import { Check, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import {
  formatDuration,
  type ExerciseTrend,
  type SessionSummary,
} from '@/lib/workout/sessionSummary'
import { useTranslation } from '@/i18n/hooks'
import { cn } from '@/lib/cn'

type WorkoutSummaryProps = {
  summary: SessionSummary
  className?: string
  showHeader?: boolean
}

function trendMeta(
  trend: ExerciseTrend,
  percent: number,
  t: (key: string, opts?: Record<string, unknown>) => string,
) {
  if (trend === 'faster') {
    return {
      icon: TrendingDown,
      label: t('trendFaster', { percent: Math.abs(percent) }),
      className: 'text-success',
    }
  }
  if (trend === 'slower') {
    return {
      icon: TrendingUp,
      label: t('trendSlower', { percent }),
      className: 'text-muted',
    }
  }
  return { icon: Minus, label: t('trendStable'), className: 'text-muted' }
}

function DurationPlot({ values, phaseLabel }: { values: number[]; phaseLabel: string }) {
  const max = Math.max(...values, 1)
  const barMaxPx = 24

  return (
    <div className="mt-2">
      <div
        className="flex h-11 items-end gap-1 rounded-lg bg-surface-2/80 px-1.5 py-1"
        aria-hidden
      >
        {values.map((value, index) => {
          const px = value > 0 ? Math.max(6, Math.round((value / max) * barMaxPx)) : 3
          return (
            <div key={index} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-0.5">
              <div
                className={cn(
                  'w-full rounded-sm transition-colors',
                  value > 0 ? 'bg-solo-400' : 'bg-line',
                  value === max && max > 0 && value > 0 && 'bg-solo-300',
                )}
                style={{ height: `${px}px` }}
                title={`${phaseLabel} ${index + 1}: ${formatDuration(value)}`}
              />
              <span className="font-mono text-[8px] text-faint">{index + 1}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <p className="text-[10px] text-muted">{label}</p>
      <p className="font-mono text-base font-bold text-fg">{value}</p>
      {sub && <p className="text-[10px] text-muted">{sub}</p>}
    </div>
  )
}

export function WorkoutSummary({
  summary,
  className,
  showHeader = true,
}: WorkoutSummaryProps) {
  const { t } = useTranslation('session')
  const { stats } = summary
  const multiSet = summary.sets.length > 1
  const timedExercises = summary.exercises.filter((ex) => ex.metric !== 'reps')

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {showHeader && (
        <div className="rounded-card border border-line bg-surface p-4">
          <h2 className="text-xl font-bold">{summary.workoutName}</h2>
          <p className="mt-1 text-sm text-muted">
            {t('summaryTotalTime')}{' '}
            <span className="font-mono font-bold text-fg">
              {formatDuration(summary.totalDurationSeconds)}
            </span>
          </p>
        </div>
      )}

      <section className="grid grid-cols-2 gap-2">
        <StatCard
          label={t('summaryAvgPhase', { phase: stats.phaseLabel.toLowerCase() })}
          value={formatDuration(stats.avgSetDurationSeconds)}
        />
        {timedExercises.length > 0 && (
          <StatCard
            label={t('summaryAvgExercise')}
            value={formatDuration(stats.avgExercisePerSetSeconds)}
          />
        )}
      </section>

      {multiSet && (
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-sm font-semibold">{t('summaryPace')}</p>
          <p className="mt-0.5 text-xs text-muted">{stats.paceLabel}</p>
          <DurationPlot
            values={summary.sets.map((set) => set.durationSeconds)}
            phaseLabel={stats.phaseLabel}
          />
        </div>
      )}

      {!multiSet && summary.sets.length === 1 && (
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-sm font-semibold">{t('summaryPace')}</p>
          <DurationPlot
            values={summary.sets.map((set) => set.durationSeconds)}
            phaseLabel={stats.phaseLabel}
          />
        </div>
      )}

      <section>
        <h3 className="mb-2 text-sm font-semibold">{t('summaryExercises')}</h3>
        <ol className="flex flex-col gap-2">
          {summary.exercises.map((ex, i) => {
            const tracksTime = ex.metric !== 'reps'
            const hasPlot = tracksTime && ex.durationsBySet.some((value) => value > 0)
            const trend = hasPlot ? trendMeta(ex.trend, ex.trendPercent, t) : null
            const TrendIcon = trend?.icon

            return (
              <li key={`${ex.name}-${i}`} className="rounded-xl border border-line bg-surface p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <Check className="size-4 shrink-0 text-success" />
                    <span className="truncate text-sm font-medium">{ex.name}</span>
                  </span>
                  {tracksTime && ex.durationSeconds > 0 ? (
                    <span className="shrink-0 font-mono text-base font-bold tabular-nums text-solo-400">
                      {formatDuration(ex.durationSeconds)}
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs text-muted">{t('summaryCompleted')}</span>
                  )}
                </div>

                {hasPlot && (
                  <>
                    <DurationPlot values={ex.durationsBySet} phaseLabel={stats.phaseLabel} />
                    {trend && TrendIcon && (
                      <p
                        className={cn(
                          'mt-1.5 flex items-center gap-1 text-[10px]',
                          trend.className,
                        )}
                      >
                        <TrendIcon className="size-3" />
                        {trend.label}
                      </p>
                    )}
                  </>
                )}
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
