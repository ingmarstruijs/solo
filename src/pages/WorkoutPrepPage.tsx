import { ArrowLeft, ChevronRight, Info, Pencil, Play, Tv } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLocker } from '@/hooks/useLocker'
import { useRecoveryScore } from '@/hooks/useRecoveryScore'
import { useTheme } from '@/hooks/useTheme'
import { buildPrepTvState } from '@/lib/tv/broadcast'
import { getTvTransportState, publishToTvTransport } from '@/lib/tv/transport'
import { activateSessionPrep, prepareWorkouts } from '@/lib/workout/sessionPrep'
import { structureSummary } from '@/lib/workout/workoutStructure'
import { PrepInsightsPanel } from '@/components/workout/PrepInsightsPanel'
import { ExerciseIcon, equipmentSummary, metricLabel } from '@/components/workout/ExerciseIcon'
import { ExerciseInfoModal } from '@/components/workout/ExerciseInfoModal'
import { LabActionButton } from '@/components/lab/LabPrimitives'
import type { WorkoutExercise } from '@/types/workout'

export function WorkoutPrepPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { items: lockerItems, activeProfile } = useLocker()
  const { score: recoveryScore } = useRecoveryScore()
  const { theme } = useTheme()

  const ids = useMemo(() => {
    const raw = params.get('ids') ?? params.get('id') ?? ''
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
  }, [params])

  const prep = useMemo(
    () => (ids.length > 0 ? prepareWorkouts(ids, lockerItems, recoveryScore) : null),
    [ids, lockerItems, recoveryScore],
  )

  if (!prep || prep.workouts.length === 0) {
    return (
      <div className="flex flex-col gap-4 py-8 text-center">
        <p className="text-muted">Workout niet gevonden.</p>
        <button type="button" onClick={() => navigate('/workouts')} className="text-solo-400">
          Terug naar workouts
        </button>
      </div>
    )
  }

  const sessionPrep = prep
  const isMulti = sessionPrep.workouts.length > 1

  function handleConnectTv() {
    publishToTvTransport(
      buildPrepTvState(
        sessionPrep.workouts.map((p) => p.workout),
        recoveryScore,
        theme,
      ),
      { openWindow: true, theme },
    )
  }

  function handleStart() {
    activateSessionPrep(sessionPrep)
    publishToTvTransport(
      buildPrepTvState(
        sessionPrep.workouts.map((p) => p.workout),
        recoveryScore,
        theme,
      ),
      { theme },
    )
    navigate('/session')
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      <button
        type="button"
        onClick={() => navigate('/workouts')}
        className="flex items-center gap-2 text-sm text-muted active:text-fg"
      >
        <ArrowLeft className="size-4" />
        Workouts
      </button>

      <header>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="label-mono text-faint">Workout prep</p>
            <h1 className="text-xl font-bold">
              {isMulti ? `${sessionPrep.workouts.length} workouts` : sessionPrep.workouts[0].workout.name}
            </h1>
        <p className="mt-1 text-xs text-muted">
          Controleer targets, verbind TV en start je sessie.
          <span className="text-faint"> · Locker: {activeProfile.name}</span>
        </p>
          </div>
          {!isMulti && (
            <button
              type="button"
              onClick={() => navigate(`/workouts/${sessionPrep.workouts[0].workout.id}/edit`)}
              className="flex shrink-0 items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted active:bg-surface-2"
            >
              <Pencil className="size-3.5" />
              Bewerken
            </button>
          )}
        </div>
      </header>

      {sessionPrep.workouts.map(({ workout, targets }, wi) => (
        <PrepInsightsPanel
          key={`insights-${workout.id}`}
          recoveryScore={recoveryScore}
          lockerCount={lockerItems.length}
          workout={workout}
          targets={targets}
          showRecoverySummary={!isMulti || wi === 0}
        />
      ))}

      {sessionPrep.workouts.map(({ workout, targets }, wi) => (
        <section key={workout.id} className="rounded-card border border-line bg-surface p-4">
          {isMulti && (
            <p className="label-mono mb-2 text-faint">
              Workout {wi + 1} · {workout.name}
            </p>
          )}
          <p className="mb-3 text-xs text-muted">{structureSummary(workout)}</p>

          <ul className="flex flex-col gap-3">
            {workout.exercises.map((ex, i) => (
              <PrepExerciseRow key={ex.id} ex={ex} index={i} targets={targets} />
            ))}
          </ul>
        </section>
      ))}

      <div className="flex flex-col gap-2">
        <LabActionButton variant="secondary" onClick={handleConnectTv} className="gap-2">
          <Tv className="size-4" />
          Verbind TV-scherm
        </LabActionButton>
        <p className="text-center text-[11px] text-faint">
          Opent {getTvTransportState().receiverUrl} · cast dat tabblad naar je TV (AirPlay/Chromecast)
        </p>

        <button
          type="button"
          onClick={handleStart}
          className="flex items-center justify-center gap-2 rounded-xl bg-solo-400 py-4 text-sm font-bold text-ink active:bg-solo-500"
        >
          <Play className="size-5 fill-ink" />
          Start sessie
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  )
}

function PrepExerciseRow({
  ex,
  index,
  targets,
}: {
  ex: WorkoutExercise
  index: number
  targets: import('@/types/workout').OverloadTarget[]
}) {
  const [showInfo, setShowInfo] = useState(false)
  const target = targets.find((t) => t.exerciseId === ex.id)
  const weight = target?.adjustedWeightKg ?? ex.weightKg
  const gear = equipmentSummary(ex.equipment)

  return (
    <li className="flex gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-surface-2">
        <ExerciseIcon metric={ex.metric} kind={ex.kind} equipment={ex.equipment} icon={ex.icon} size={24} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold">{ex.name}</p>
          {ex.description && (
            <button
              type="button"
              onClick={() => setShowInfo(true)}
              className="grid size-11 shrink-0 place-items-center rounded-xl text-muted active:bg-surface-2"
              aria-label={`Uitleg ${ex.name}`}
            >
              <Info className="size-5" />
            </button>
          )}
        </div>
        <p className="text-xs text-muted">
          {metricLabel(ex.metric, ex.target)}
          {weight > 0 && ` · ${weight} kg`}
          {gear && ` · ${gear}`}
          {ex.restSeconds > 0 && ` · rust ${ex.restSeconds}s`}
        </p>
      </div>
      <span className="label-mono shrink-0 text-faint">#{index + 1}</span>

      {showInfo && ex.description && (
        <ExerciseInfoModal
          name={ex.name}
          description={ex.description}
          onClose={() => setShowInfo(false)}
        />
      )}
    </li>
  )
}
