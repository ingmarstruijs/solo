import { Cast, ChevronRight, Heart, Scale, Tv } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { OverloadTarget, WorkoutTemplate } from '@/types/workout'
import { isRecoveryCritical } from '@/lib/storage/recoveryStore'
import { PipelineStage } from '@/components/lab/LabPrimitives'
import { LabActionButton } from '@/components/lab/LabPrimitives'
import { WeightAssistantList } from '@/components/workout/WeightAssistant'
import { cn } from '@/lib/cn'

type WorkoutPrepFlowProps = {
  workout: WorkoutTemplate
  recoveryScore: number
  targets: OverloadTarget[]
  onStartSession: () => void
}

export function WorkoutPrepFlow({
  workout,
  recoveryScore,
  targets,
  onStartSession,
}: WorkoutPrepFlowProps) {
  const navigate = useNavigate()
  const critical = isRecoveryCritical(recoveryScore)
  const hasAdjustments = targets.some((t) => t.adjustedWeightKg !== t.originalWeightKg)

  const plateItems = useMemo(
    () =>
      targets
        .filter((t) => t.plateConfig && t.adjustedWeightKg > 0)
        .map((t) => ({
          exerciseName: workout.exercises.find((e) => e.id === t.exerciseId)?.name ?? 'Oefening',
          config: t.plateConfig!,
        })),
    [targets, workout.exercises],
  )

  const hasPlates = plateItems.some(
    (p) => p.config.mode === 'barbell' && p.config.platesPerSide.length > 0,
  )

  return (
    <section className="flex flex-col gap-4 rounded-card border border-solo-400/30 bg-surface p-4">
      <header>
        <p className="label-mono text-faint">Workout prep</p>
        <h2 className="text-lg font-bold">{workout.name}</h2>
        <p className="mt-1 text-xs text-muted">
          Pre-workout voorbereiding: recovery, targets, gewicht en TV.
        </p>
      </header>

      <ol className="flex flex-col gap-3">
        <PipelineStage
          step="1"
          title="Recovery score"
          description="Mock score — Health Connect integratie volgt later."
          status={critical ? 'warn' : 'ok'}
        >
          <div className="flex items-center gap-3">
            <Heart className={cn('size-5', critical ? 'text-warn' : 'text-success')} />
            <span className="text-2xl font-bold tabular-nums">{recoveryScore}%</span>
            {critical && (
              <span className="text-xs text-warn">Kritiek — gewichten worden verlaagd</span>
            )}
          </div>
        </PipelineStage>

        <PipelineStage
          step="2"
          title="Overload Planner"
          description="Targets berekend op basis van Home Locker inventaris."
          status={hasAdjustments ? 'active' : 'ok'}
        >
          <ul className="flex flex-col gap-1.5">
            {targets.slice(0, 4).map((t) => {
              const ex = workout.exercises.find((e) => e.id === t.exerciseId)
              if (!ex) return null
              return (
                <li key={t.exerciseId} className="flex justify-between text-xs">
                  <span className="text-muted">{ex.name}</span>
                  <span className="font-mono">
                    {t.originalWeightKg > 0 ? (
                      <>
                        <span
                          className={
                            t.adjustedWeightKg !== t.originalWeightKg
                              ? 'text-warn line-through'
                              : ''
                          }
                        >
                          {t.originalWeightKg} kg
                        </span>
                        {t.adjustedWeightKg !== t.originalWeightKg && (
                          <span className="ml-1 text-solo-300">→ {t.adjustedWeightKg} kg</span>
                        )}
                      </>
                    ) : (
                      'Lichaamsgewicht'
                    )}
                  </span>
                </li>
              )
            })}
            {targets.length > 4 && (
              <li className="text-xs text-faint">+{targets.length - 4} meer…</li>
            )}
          </ul>
        </PipelineStage>

        <PipelineStage
          step="3"
          title="Weight Assistant"
          description="Brutalist vector schijf-configuratie voor beschikbare gewichten."
          status={hasPlates ? 'ok' : plateItems.length > 0 ? 'active' : 'pending'}
        >
          {plateItems.length > 0 ? (
            <WeightAssistantList items={plateItems} />
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted">
              <Scale className="size-4 text-solo-400" />
              Geen gewichten in deze workout
            </div>
          )}
        </PipelineStage>

        <PipelineStage
          step="4"
          title="Cast naar TV"
          description="16:9 canvas feed via AirPlay of Chromecast."
          status="idle"
        >
          <div className="flex gap-2">
            <LabActionButton variant="secondary" onClick={() => navigate('/tv')} className="gap-1.5">
              <Tv className="size-4" />
              TV verbinden
            </LabActionButton>
            <LabActionButton
              variant="secondary"
              onClick={() => navigate('/lab/cast-stream')}
              className="gap-1.5"
            >
              <Cast className="size-4" />
              Cast lab
            </LabActionButton>
          </div>
        </PipelineStage>
      </ol>

      <button
        type="button"
        onClick={onStartSession}
        className="flex items-center justify-center gap-2 rounded-xl bg-solo-400 py-4 text-sm font-bold text-ink active:bg-solo-500"
      >
        Start sessie
        <ChevronRight className="size-5" />
      </button>
    </section>
  )
}
