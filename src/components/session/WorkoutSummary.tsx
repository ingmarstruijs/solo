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
  variant?: 'mobile' | 'tv'
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

function DurationPlot({
  values,
  phaseLabel,
  variant,
}: {
  values: number[]
  phaseLabel: string
  variant: 'mobile' | 'tv'
}) {
  const max = Math.max(...values, 1)
  const isTv = variant === 'tv'
  const barMaxPx = isTv ? 28 : 24

  return (
    <div className={cn('mt-2', isTv ? 'mt-[1vh]' : '')}>
      <div
        className={cn(
          'flex items-end rounded-lg bg-surface-2/80',
          isTv ? 'h-[5.5vh] gap-[0.5vh] px-[0.6vh] py-[0.6vh]' : 'h-11 gap-1 px-1.5 py-1',
        )}
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
              <span className={cn('font-mono text-faint', isTv ? 'text-[1.1vh]' : 'text-[8px]')}>
                {index + 1}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  variant,
}: {
  label: string
  value: string
  sub?: string
  variant: 'mobile' | 'tv'
}) {
  const isTv = variant === 'tv'
  return (
    <div
      className={cn(
        'rounded-xl border border-line bg-surface',
        isTv ? 'px-[2vh] py-[1.5vh]' : 'px-3 py-2.5',
      )}
    >
      <p className={cn('text-muted', isTv ? 'text-[1.4vh]' : 'text-[10px]')}>{label}</p>
      <p className={cn('font-mono font-bold text-fg', isTv ? 'text-[2.4vh]' : 'text-base')}>
        {value}
      </p>
      {sub && (
        <p className={cn('text-muted', isTv ? 'text-[1.3vh]' : 'text-[10px]')}>{sub}</p>
      )}
    </div>
  )
}

export function WorkoutSummary({
  summary,
  className,
  variant = 'mobile',
  showHeader = true,
}: WorkoutSummaryProps) {
  const { t } = useTranslation('session')
  const isTv = variant === 'tv'
  const { stats } = summary
  const multiSet = summary.sets.length > 1
  const timedExercises = summary.exercises.filter((ex) => ex.metric !== 'reps')

  return (
    <div className={cn('flex flex-col', isTv ? 'gap-[2vh]' : 'gap-4', className)}>
      {showHeader && (
        <div className={cn('rounded-card border border-line bg-surface', isTv ? 'p-[2.5vh]' : 'p-4')}>
          <h2 className={cn('font-bold', isTv ? 'text-[4vh]' : 'text-xl')}>{summary.workoutName}</h2>
          <p className={cn('text-muted', isTv ? 'mt-[1vh] text-[2.2vh]' : 'mt-1 text-sm')}>
            {t('summaryTotalTime')}{' '}
            <span className="font-mono font-bold text-fg">
              {formatDuration(summary.totalDurationSeconds)}
            </span>
          </p>
        </div>
      )}

      <section className={cn('grid grid-cols-2', isTv ? 'gap-[1.2vh]' : 'gap-2')}>
        <StatCard
          variant={variant}
          label={t('summaryAvgPhase', { phase: stats.phaseLabel.toLowerCase() })}
          value={formatDuration(stats.avgSetDurationSeconds)}
        />
        {timedExercises.length > 0 && (
          <StatCard
            variant={variant}
            label={t('summaryAvgExercise')}
            value={formatDuration(stats.avgExercisePerSetSeconds)}
          />
        )}
      </section>

      {multiSet && (
        <div className={cn('rounded-xl border border-line bg-surface', isTv ? 'p-[2vh]' : 'p-3')}>
          <p className={cn('font-semibold', isTv ? 'text-[2vh]' : 'text-sm')}>{t('summaryPace')}</p>
          <p className={cn('text-muted', isTv ? 'mt-[0.5vh] text-[1.8vh]' : 'mt-0.5 text-xs')}>
            {stats.paceLabel}
          </p>
          <DurationPlot
            values={summary.sets.map((set) => set.durationSeconds)}
            phaseLabel={stats.phaseLabel}
            variant={variant}
          />
        </div>
      )}

      {!multiSet && summary.sets.length === 1 && (
        <div className={cn('rounded-xl border border-line bg-surface', isTv ? 'p-[2vh]' : 'p-3')}>
          <p className={cn('font-semibold', isTv ? 'text-[2vh]' : 'text-sm')}>{t('summaryPace')}</p>
          <DurationPlot
            values={summary.sets.map((set) => set.durationSeconds)}
            phaseLabel={stats.phaseLabel}
            variant={variant}
          />
        </div>
      )}

      <section>
        <h3 className={cn('mb-2 font-semibold', isTv ? 'text-[2.2vh]' : 'text-sm')}>
          {t('summaryExercises')}
        </h3>
        <ol className={cn('flex flex-col', isTv ? 'gap-[1.2vh]' : 'gap-2')}>
          {summary.exercises.map((ex, i) => {
            const tracksTime = ex.metric !== 'reps'
            const hasPlot = tracksTime && ex.durationsBySet.some((value) => value > 0)
            const trend = hasPlot ? trendMeta(ex.trend, ex.trendPercent, t) : null
            const TrendIcon = trend?.icon

            return (
              <li
                key={`${ex.name}-${i}`}
                className={cn(
                  'rounded-xl border border-line bg-surface',
                  isTv ? 'p-[2vh]' : 'p-3',
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <Check className={cn('shrink-0 text-success', isTv ? 'size-[2vh]' : 'size-4')} />
                    <span className={cn('truncate font-medium', isTv ? 'text-[2.2vh]' : 'text-sm')}>
                      {ex.name}
                    </span>
                  </span>
                  {tracksTime && ex.durationSeconds > 0 ? (
                    <span
                      className={cn(
                        'shrink-0 font-mono font-bold tabular-nums text-solo-400',
                        isTv ? 'text-[2.4vh]' : 'text-base',
                      )}
                    >
                      {formatDuration(ex.durationSeconds)}
                    </span>
                  ) : (
                    <span className={cn('shrink-0 text-muted', isTv ? 'text-[1.8vh]' : 'text-xs')}>
                      {t('summaryCompleted')}
                    </span>
                  )}
                </div>

                {hasPlot && (
                  <>
                    <DurationPlot
                      values={ex.durationsBySet}
                      phaseLabel={stats.phaseLabel}
                      variant={variant}
                    />
                    {trend && TrendIcon && (
                      <p
                        className={cn(
                          'mt-1.5 flex items-center gap-1',
                          trend.className,
                          isTv ? 'text-[1.4vh]' : 'text-[10px]',
                        )}
                      >
                        <TrendIcon className={isTv ? 'size-[1.6vh]' : 'size-3'} />
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
