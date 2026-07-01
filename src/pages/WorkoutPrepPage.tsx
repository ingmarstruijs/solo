import { Pencil, Play } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageBackButton } from '@/components/layout/PageBackButton'
import { SessionControlBar } from '@/components/session/SessionControlBar'
import { useCameraEnabled } from '@/hooks/useCameraEnabled'
import { useCoachEnabled } from '@/hooks/useCoachEnabled'
import { useLocker } from '@/hooks/useLocker'
import { useRecoveryScore } from '@/hooks/useRecoveryScore'
import { useTheme } from '@/hooks/useTheme'
import { useTvConnection } from '@/hooks/useTvConnection'
import { buildPrepTvState } from '@/lib/tv/broadcast'
import { getTvTransportState, publishToTvTransport, reconnectTv, disconnectTv, publishTvIdle } from '@/lib/tv/transport'
import { activateSessionPrep, prepareWorkouts } from '@/lib/workout/sessionPrep'
import { structureSummary } from '@/lib/workout/workoutStructure'
import { PrepInsightsPanel } from '@/components/workout/PrepInsightsPanel'
import { ExerciseIcon, equipmentSummary, metricLabel } from '@/components/workout/ExerciseIcon'
import { ExerciseInfoModal } from '@/components/workout/ExerciseInfoModal'
import type { WorkoutExercise } from '@/types/workout'

export function WorkoutPrepPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { items: lockerItems } = useLocker()
  const { score: recoveryScore } = useRecoveryScore()
  const { theme } = useTheme()
  const { enabled: coachEnabled, toggleEnabled: toggleCoach } = useCoachEnabled()
  const { enabled: cameraEnabled, setEnabled: setCameraEnabled } = useCameraEnabled()
  const { status: tvStatus } = useTvConnection()

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
  const primaryWorkout = sessionPrep.workouts[0]

  function buildTvState() {
    return buildPrepTvState(
      sessionPrep.workouts.map((p) => p.workout),
      recoveryScore,
      theme,
    )
  }

  function handleConnectTv() {
    void reconnectTv(buildTvState(), { theme })
  }

  function handleDisconnectTv() {
    publishTvIdle(theme)
    disconnectTv()
  }

  function handleStart() {
    activateSessionPrep(sessionPrep)
    publishToTvTransport(buildTvState(), { theme })
    navigate('/session')
  }

  return (
    <div className="flex flex-col gap-3 py-1">
      <div className="flex items-center gap-2">
        <PageBackButton to="/workouts" />
        <div className="min-w-0 flex-1">
          <p className="label-mono truncate text-[10px] text-faint">
            {isMulti ? `${sessionPrep.workouts.length} workouts` : 'Workout prep'}
          </p>
          <h1 className="truncate text-base font-bold">
            {isMulti ? 'Multi-workout prep' : primaryWorkout.workout.name}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {!isMulti && (
            <button
              type="button"
              onClick={() => navigate(`/workouts/${primaryWorkout.workout.id}/edit`)}
              className="grid size-11 place-items-center rounded-xl border border-line bg-surface-2 text-muted active:bg-surface-3"
              aria-label="Bewerken"
            >
              <Pencil className="size-5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleStart}
            className="grid size-11 place-items-center rounded-xl bg-solo-400 text-ink active:bg-solo-500"
            aria-label="Start sessie"
          >
            <Play className="size-5 fill-ink" />
          </button>
        </div>
      </div>

      <SessionControlBar
        cameraEnabled={cameraEnabled}
        onCameraChange={setCameraEnabled}
        coachEnabled={coachEnabled}
        onCoachToggle={toggleCoach}
        tvStatus={tvStatus}
        onConnectTv={handleConnectTv}
        onDisconnectTv={handleDisconnectTv}
      />

      <p className="text-[11px] text-faint">
        Stel camera, coach en TV in. Start opent de live sessie — daar begin je met de eerste oefening.
      </p>

      <PrepInsightsPanel
        recoveryScore={recoveryScore}
        lockerCount={lockerItems.length}
        workout={primaryWorkout.workout}
        targets={primaryWorkout.targets}
        showRecoverySummary
      />

      {sessionPrep.workouts.map(({ workout, targets }, wi) => (
        <section key={workout.id} className="rounded-card border border-line bg-surface p-3">
          {isMulti && (
            <p className="label-mono mb-2 text-faint">
              Workout {wi + 1} · {workout.name}
            </p>
          )}
          <p className="mb-2 text-xs text-muted">{structureSummary(workout)}</p>

          <ul className="flex flex-col gap-3">
            {workout.exercises.map((ex, i) => (
              <PrepExerciseRow key={ex.id} ex={ex} index={i} targets={targets} />
            ))}
          </ul>
        </section>
      ))}

      <p className="text-center text-[10px] text-faint">
        TV: {getTvTransportState().receiverUrl}
      </p>
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
        <p className="text-sm font-semibold">{ex.name}</p>
        <p className="text-xs text-muted">
          {metricLabel(ex.metric, ex.target)}
          {weight > 0 && ` · ${weight} kg`}
          {gear && ` · ${gear}`}
          {ex.restSeconds > 0 && ` · rust ${ex.restSeconds}s`}
        </p>
        {ex.description && (
          <button
            type="button"
            onClick={() => setShowInfo(true)}
            className="mt-1 text-xs font-medium text-solo-400 active:opacity-70"
          >
            Bekijk uitleg
          </button>
        )}
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
