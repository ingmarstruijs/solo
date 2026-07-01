import { Boxes, ChevronDown, Scale, X } from 'lucide-react'
import { useState } from 'react'
import type { OverloadTarget, WorkoutTemplate } from '@/types/workout'
import { isRecoveryCritical } from '@/lib/storage/recoveryStore'
import { WeightAssistant } from './WeightAssistant'
import { cn } from '@/lib/cn'

type PreparedWorkoutInsights = {
  workout: WorkoutTemplate
  targets: OverloadTarget[]
}

type PrepInsightsPanelProps = {
  workouts: PreparedWorkoutInsights[]
  recoveryScore: number
  lockerCount: number
  lockerName: string
  garminConnected: boolean
}

export function PrepInsightsPanel({
  workouts,
  recoveryScore,
  lockerCount,
  lockerName,
  garminConnected,
}: PrepInsightsPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [weightFor, setWeightFor] = useState<{ workoutId: string; exerciseId: string } | null>(null)

  const allTargets = workouts.flatMap((w) => w.targets)
  const adjustedCount = allTargets.filter((t) => t.adjustedWeightKg !== t.originalWeightKg).length
  const critical = garminConnected && isRecoveryCritical(recoveryScore)
  const title = garminConnected ? 'Gewichten & herstel' : 'Gewichten'

  const summaryParts: string[] = []
  if (garminConnected) summaryParts.push(`herstel ${recoveryScore}%`)
  if (adjustedCount > 0) summaryParts.push(`${adjustedCount} gewichten aangepast`)
  if (summaryParts.length === 0) summaryParts.push('geen aanpassingen')

  const weightWorkout = weightFor ? workouts.find((w) => w.workout.id === weightFor.workoutId) : null
  const weightTarget = weightFor
    ? weightWorkout?.targets.find((t) => t.exerciseId === weightFor.exerciseId)
    : null
  const weightExercise = weightFor
    ? weightWorkout?.workout.exercises.find((e) => e.id === weightFor.exerciseId)
    : null

  return (
    <>
      <section className="rounded-card border border-line bg-surface">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center gap-3 p-3 text-left active:bg-surface-2"
        >
          <Scale className={cn('size-4 shrink-0', critical ? 'text-warn' : 'text-solo-400')} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{title}</p>
            <p className="truncate text-xs text-muted">{summaryParts.join(' · ')}</p>
          </div>
          <ChevronDown
            className={cn('size-4 shrink-0 text-faint transition-transform', expanded && 'rotate-180')}
          />
        </button>

        {expanded && (
          <div className="border-t border-line px-3 pb-3 pt-2">
            <p className="text-xs leading-relaxed text-muted">
              Doelgewichten op basis van locker <strong className="font-medium text-fg">{lockerName}</strong>
              {garminConnected && ' en herstel'}
              {garminConnected ? '. Bij laag herstel worden zware targets iets verlaagd.' : '.'}
            </p>
            {critical && (
              <p className="mt-2 text-xs text-warn">Laag herstel — gewichten verlaagd met 5–10%</p>
            )}
            <div className="mt-2 flex items-center gap-2 text-xs text-muted">
              <Boxes className="size-3.5 text-solo-400" />
              {lockerCount} items in {lockerName}
            </div>

            {workouts.map(({ workout, targets }, wi) => (
              <div key={workout.id} className={cn('mt-3', wi > 0 && 'border-t border-line pt-3')}>
                {workouts.length > 1 && (
                  <p className="label-mono mb-2 text-faint">
                    Workout {wi + 1} · {workout.name}
                  </p>
                )}
                <ul className="flex flex-col gap-2">
                  {workout.exercises.map((ex) => {
                    const target = targets.find((t) => t.exerciseId === ex.id)
                    if (!target) return null
                    const changed = target.adjustedWeightKg !== target.originalWeightKg
                    return (
                      <li
                        key={ex.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface-2 px-2.5 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">{ex.name}</p>
                          <p className="text-[10px] text-muted">
                            {target.adjustedWeightKg > 0
                              ? `${target.adjustedWeightKg} kg`
                              : 'Lichaamsgewicht'}
                            {changed && target.reason && ` · ${target.reason}`}
                          </p>
                        </div>
                        {target.plateConfig && target.adjustedWeightKg > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setWeightFor({ workoutId: workout.id, exerciseId: ex.id })
                            }
                            className="grid size-9 shrink-0 place-items-center rounded-lg border border-line text-solo-400 active:bg-surface"
                            aria-label={`Gewichten voor ${ex.name}`}
                          >
                            <Scale className="size-4" />
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {weightTarget?.plateConfig && weightExercise && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
          onClick={() => setWeightFor(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-lg rounded-card border border-line bg-surface p-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Weight Assistant"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{weightExercise.name}</h3>
              <button
                type="button"
                onClick={() => setWeightFor(null)}
                className="grid size-9 place-items-center rounded-lg text-muted active:bg-surface-2"
              >
                <X className="size-5" />
              </button>
            </div>
            <WeightAssistant exerciseName={weightExercise.name} config={weightTarget.plateConfig} />
          </div>
        </div>
      )}
    </>
  )
}
