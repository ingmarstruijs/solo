import { Check, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import {
  formatDuration,
  type ExerciseTrend,
  type SessionSummary,
} from '@/lib/workout/sessionSummary'
import { cn } from '@/lib/cn'

type WorkoutSummaryProps = {
  summary: SessionSummary
  className?: string
  variant?: 'mobile' | 'tv'
  showHeader?: boolean
}

function trendMeta(trend: ExerciseTrend, percent: number) {
  if (trend === 'faster') {
    return {
      icon: TrendingDown,
      label: `${Math.abs(percent)}% sneller`,
      className: 'text-success',
    }
  }
  if (trend === 'slower') {
    return {
      icon: TrendingUp,
      label: `${percent}% langzamer`,
      className: 'text-warn',
    }
  }
  return { icon: Minus, label: 'Stabiel', className: 'text-muted' }
}

function Sparkline({
  values,
  variant,
}: {
  values: number[]
  variant: 'mobile' | 'tv'
}) {
  const max = Math.max(...values, 1)
  const isTv = variant === 'tv'

  return (
    <div
      className={cn('flex items-end', isTv ? 'h-[4vh] gap-[0.4vh]' : 'h-8 gap-0.5')}
      aria-hidden
    >
      {values.map((value, index) => (
        <div
          key={index}
          className={cn(
            'flex-1 rounded-sm bg-solo-400/70',
            value === max && max > 0 && 'bg-solo-400',
          )}
          style={{ height: `${Math.max(12, Math.round((value / max) * 100))}%` }}
          title={`Set ${index + 1}: ${formatDuration(value)}`}
        />
      ))}
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
  const isTv = variant === 'tv'
  const { stats } = summary
  const multiSet = summary.sets.length > 1

  return (
    <div className={cn('flex flex-col', isTv ? 'gap-[2vh]' : 'gap-4', className)}>
      {showHeader && (
        <div className={cn('rounded-card border border-line bg-surface', isTv ? 'p-[2.5vh]' : 'p-4')}>
          <h2 className={cn('font-bold', isTv ? 'text-[4vh]' : 'text-xl')}>{summary.workoutName}</h2>
          <p className={cn('text-muted', isTv ? 'mt-[1vh] text-[2.2vh]' : 'mt-1 text-sm')}>
            Totale tijd{' '}
            <span className="font-mono font-bold text-fg">
              {formatDuration(summary.totalDurationSeconds)}
            </span>
          </p>
        </div>
      )}

      <section className={cn('grid grid-cols-2', isTv ? 'gap-[1.2vh]' : 'gap-2')}>
        <StatCard
          variant={variant}
          label={`Gem. ${stats.phaseLabel.toLowerCase()}`}
          value={formatDuration(stats.avgSetDurationSeconds)}
        />
        <StatCard
          variant={variant}
          label="Gem. per oefening"
          value={formatDuration(stats.avgExercisePerSetSeconds)}
        />
        {stats.fastestSet && (
          <StatCard
            variant={variant}
            label={`Snelste ${stats.phaseLabel.toLowerCase()}`}
            value={formatDuration(stats.fastestSet.seconds)}
            sub={`${stats.phaseLabel} ${stats.fastestSet.setNumber}`}
          />
        )}
        {stats.slowestSet && (
          <StatCard
            variant={variant}
            label={`Langzaamste ${stats.phaseLabel.toLowerCase()}`}
            value={formatDuration(stats.slowestSet.seconds)}
            sub={`${stats.phaseLabel} ${stats.slowestSet.setNumber}`}
          />
        )}
      </section>

      {multiSet && (
        <div className={cn('rounded-xl border border-line bg-surface', isTv ? 'p-[2vh]' : 'p-3')}>
          <p className={cn('font-semibold', isTv ? 'text-[2vh]' : 'text-sm')}>Tempo</p>
          <p className={cn('text-muted', isTv ? 'mt-[0.5vh] text-[1.8vh]' : 'mt-0.5 text-xs')}>
            {stats.paceLabel}
          </p>
        </div>
      )}

      {summary.sets.length > 0 && (
        <section>
          <h3 className={cn('mb-2 font-semibold', isTv ? 'text-[2.2vh]' : 'text-sm')}>
            Tijd per {stats.phaseLabel.toLowerCase()}
          </h3>
          <ol className={cn('flex flex-col', isTv ? 'gap-[1vh]' : 'gap-1.5')}>
            {summary.sets.map((set) => (
              <li
                key={set.setNumber}
                className={cn(
                  'flex items-center justify-between rounded-xl border border-line bg-surface',
                  isTv ? 'px-[2vh] py-[1.5vh] text-[2vh]' : 'px-3 py-2 text-sm',
                )}
              >
                <span className="font-medium">{set.label}</span>
                <span className="font-mono font-bold tabular-nums text-solo-400">
                  {formatDuration(set.durationSeconds)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <h3 className={cn('mb-2 font-semibold', isTv ? 'text-[2.2vh]' : 'text-sm')}>
          Oefeningen
        </h3>
        <ol className={cn('flex flex-col', isTv ? 'gap-[1.2vh]' : 'gap-2')}>
          {summary.exercises.map((ex, i) => {
            const trend = trendMeta(ex.trend, ex.trendPercent)
            const TrendIcon = trend.icon

            return (
              <li
                key={`${ex.name}-${i}`}
                className={cn(
                  'rounded-xl border border-line bg-surface',
                  isTv ? 'p-[2vh]' : 'p-3',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <Check className={cn('shrink-0 text-success', isTv ? 'size-[2vh]' : 'size-4')} />
                    <span className={cn('truncate font-medium', isTv ? 'text-[2.2vh]' : 'text-sm')}>
                      {ex.name}
                    </span>
                  </span>
                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        'font-mono font-bold tabular-nums text-solo-400',
                        isTv ? 'text-[2.8vh]' : 'text-lg',
                      )}
                    >
                      {formatDuration(ex.durationSeconds)}
                    </p>
                    {ex.avgPerSet > 0 && (
                      <p className={cn('text-muted', isTv ? 'text-[1.4vh]' : 'text-[10px]')}>
                        ø {formatDuration(ex.avgPerSet)} / {stats.phaseLabel.toLowerCase()}
                      </p>
                    )}
                  </div>
                </div>

                {multiSet && ex.durationsBySet.some((value) => value > 0) && (
                  <div className={cn('mt-3', isTv ? 'mt-[1.5vh]' : '')}>
                    <Sparkline values={ex.durationsBySet} variant={variant} />
                    <div
                      className={cn(
                        'mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1',
                        isTv ? 'text-[1.4vh]' : 'text-[10px]',
                      )}
                    >
                      {ex.durationsBySet.map((value, setIndex) => (
                        <span key={setIndex} className="font-mono text-muted">
                          {stats.phaseLabel[0]}
                          {setIndex + 1}:{' '}
                          <span className="text-fg">{formatDuration(value)}</span>
                        </span>
                      ))}
                      <span className={cn('flex items-center gap-1', trend.className)}>
                        <TrendIcon className={isTv ? 'size-[1.6vh]' : 'size-3'} />
                        {trend.label}
                      </span>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </section>

      {(stats.fastestExercise || stats.slowestExercise) && (
        <section className={cn('grid grid-cols-2', isTv ? 'gap-[1.2vh]' : 'gap-2')}>
          {stats.fastestExercise && (
            <StatCard
              variant={variant}
              label="Snelste oefening (ø)"
              value={formatDuration(stats.fastestExercise.avgSeconds)}
              sub={stats.fastestExercise.name}
            />
          )}
          {stats.slowestExercise && (
            <StatCard
              variant={variant}
              label="Langzaamste oefening (ø)"
              value={formatDuration(stats.slowestExercise.avgSeconds)}
              sub={stats.slowestExercise.name}
            />
          )}
        </section>
      )}
    </div>
  )
}
