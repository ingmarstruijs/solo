import { ChevronRight, Pencil } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { PageStickyHeader, StickyHeaderIconButton } from '@/components/layout/PageStickyHeader'
import { SessionControlBar } from '@/components/session/SessionControlBar'
import { useCameraEnabled } from '@/hooks/useCameraEnabled'
import { useCoachEnabled } from '@/hooks/useCoachEnabled'
import { useGarminConnected } from '@/hooks/useGarminConnected'
import { useLiveHeartRate } from '@/hooks/useLiveHeartRate'
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
import { useTranslation } from '@/i18n/hooks'
import { cn } from '@/lib/cn'

export function WorkoutPrepPage() {
  const { t } = useTranslation(['session', 'common', 'workouts'])
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { items: lockerItems, activeProfile } = useLocker()
  const { score: recoveryScore, setScore: setRecoveryScore } = useRecoveryScore()
  const { connected: garminConnected } = useGarminConnected()
  const heartRate = useLiveHeartRate()
  const { theme } = useTheme()
  const { enabled: coachEnabled, toggleEnabled: toggleCoach } = useCoachEnabled()
  const { enabled: cameraEnabled, setEnabled: setCameraEnabled } = useCameraEnabled()
  const { status: tvStatus } = useTvConnection()

  const ids = useMemo(() => {
    const raw = params.get('ids') ?? params.get('id') ?? ''
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
  }, [params])

  const prep = useMemo(
    () =>
      ids.length > 0
        ? prepareWorkouts(ids, lockerItems, recoveryScore, {
            applyRecovery: garminConnected,
          })
        : null,
    [ids, lockerItems, recoveryScore, garminConnected],
  )

  if (!prep || prep.workouts.length === 0) {
    return (
      <div className="flex flex-col gap-4 py-8 text-center">
        <p className="text-muted">{t('session:workoutNotFound')}</p>
        <button type="button" onClick={() => navigate('/workouts')} className="text-solo-400">
          {t('session:backToWorkouts')}
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
      <PageStickyHeader
        title={
          isMulti
            ? t('session:prepareTitle', {
                workout: `${sessionPrep.workouts.length} ${t('common:workouts')}`,
              })
            : t('session:prepareTitle', { workout: primaryWorkout.workout.name })
        }
        onBack={() => navigate('/workouts')}
        titleClassName="text-solo-400"
        actions={
          !isMulti ? (
            <StickyHeaderIconButton
              icon={Pencil}
              label={t('common:edit')}
              onClick={() => navigate(`/workouts/${primaryWorkout.workout.id}/edit`)}
            />
          ) : undefined
        }
      />

      <SessionControlBar
        cameraEnabled={cameraEnabled}
        onCameraChange={setCameraEnabled}
        coachEnabled={coachEnabled}
        onCoachToggle={toggleCoach}
        tvStatus={tvStatus}
        onConnectTv={handleConnectTv}
        onDisconnectTv={handleDisconnectTv}
        hrEnabled={garminConnected}
        hrConnecting={heartRate.status === 'connecting'}
        hrLive={heartRate.live}
        hrBpm={heartRate.bpm}
        onHrConnect={heartRate.connect}
        onHrDisconnect={heartRate.disconnect}
      />
      {garminConnected && heartRate.error && (
        <p className="text-[11px] text-warn">{heartRate.error}</p>
      )}

      <p className="text-[11px] text-faint">
        {t('session:prepare')} — {t('session:readyStart')}
      </p>

      <PrepInsightsPanel
        workouts={sessionPrep.workouts}
        recoveryScore={recoveryScore}
        onRecoveryChange={setRecoveryScore}
        lockerCount={lockerItems.length}
        lockerName={activeProfile.name}
        garminConnected={garminConnected}
      />

      {sessionPrep.workouts.map(({ workout, targets }, wi) => (
        <section key={workout.id} className="rounded-card border border-line bg-surface p-3">
          {isMulti && (
            <p className="label-mono mb-2 text-faint">
              {t('session:workoutN', { n: wi + 1, name: workout.name })}
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
  const { t } = useTranslation('session')
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
            {ex.restSeconds > 0 && ` · ${t('session:restInline', { seconds: ex.restSeconds })}`}
          </p>
          <p className="mt-1 text-xs font-medium text-solo-400">{t('session:viewInstructions')}</p>
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
