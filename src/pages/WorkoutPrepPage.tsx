import { ChevronRight, Pencil } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageBackButton } from '@/components/layout/PageBackButton'
import { SessionControlBar } from '@/components/session/SessionControlBar'
import { useCameraEnabled } from '@/hooks/useCameraEnabled'
import { useCoachEnabled } from '@/hooks/useCoachEnabled'
import { useGarminConnected } from '@/hooks/useGarminConnected'
import { useLocker } from '@/hooks/useLocker'
import { useRecoveryScore } from '@/hooks/useRecoveryScore'
import { useTheme } from '@/hooks/useTheme'
import { useTvConnection } from '@/hooks/useTvConnection'
import { getTvTransportState, reconnectTv, disconnectTv, publishTvIdle } from '@/lib/tv/transport'
import { buildPrepTvState } from '@/lib/tv/broadcast'
import { prepareWorkouts } from '@/lib/workout/sessionPrep'
import { structureSummary } from '@/lib/workout/workoutStructure'
import { PrepInsightsPanel } from '@/components/workout/PrepInsightsPanel'
import { ExerciseIcon, equipmentSummary, metricLabel } from '@/components/workout/ExerciseIcon'
import { ExerciseInfoModal } from '@/components/workout/ExerciseInfoModal'
import type { WorkoutExercise } from '@/types/workout'
import { cn } from '@/lib/cn'

export function WorkoutPrepPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { items: lockerItems, activeProfile } = useLocker()
  const { score: recoveryScore } = useRecoveryScore()
  const { connected: garminConnected } = useGarminConnected()
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

  return (
    <div className="flex flex-col gap-3 py-1 pb-20">
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
        {!isMulti && (
          <button
            type="button"
            onClick={() => navigate(`/workouts/${primaryWorkout.workout.id}/edit`)}
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-surface-2 text-muted active:bg-surface-3"
            aria-label="Bewerken"
          >
            <Pencil className="size-5" />
          </button>
        )}
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
        Stel camera, coach en TV in. Druk op Start onderin om de live sessie te openen.
      </p>

      <PrepInsightsPanel
        workouts={sessionPrep.workouts}
        recoveryScore={recoveryScore}
        lockerCount={lockerItems.length}
        lockerName={activeProfile.name}
        garminConnected={garminConnected}
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
    <li>
      <button
        type="button"
        onClick={() => setShowInfo(true)}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl border border-line bg-surface-2 p-3 text-left',
          'transition-colors active:border-solo-400/40 active:bg-solo-400/10',
        )}
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-line bg-surface">
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
          <p className="mt-1 text-xs font-medium text-solo-400">Bekijk uitleg</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="label-mono text-faint">#{index + 1}</span>
          <ChevronRight className="size-4 text-faint" aria-hidden />
        </div>
      </button>

      {showInfo && (
        <ExerciseInfoModal exercise={ex} onClose={() => setShowInfo(false)} />
      )}
    </li>
  )
}
