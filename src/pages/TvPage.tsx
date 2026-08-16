import { useEffect, useState } from 'react'
import { LogoMark } from '@/components/Logo'
import { EquipmentIcon } from '@/components/locker/EquipmentIcon'
import { TvCameraPanel } from '@/components/tv/TvCoachOverlay'
import { TvRestTimer } from '@/components/tv/TvRestTimer'
import { TvExerciseVisual } from '@/components/tv/TvExerciseVisual'
import { TvSensorStrip } from '@/components/tv/TvSensorStrip'
import { WorkoutSummary } from '@/components/session/WorkoutSummary'
import { MarkdownText } from '@/components/MarkdownText'
import { useAutoThemeWatcher } from '@/hooks/useTheme'
import { useElapsedTimer } from '@/hooks/useElapsedTimer'
import { formatDuration, normalizeSummary } from '@/lib/workout/sessionSummary'
import { resolveExerciseVisual } from '@/lib/tv/exerciseMedia'
import { applyTheme } from '@/lib/theme/themes'
import { useTranslation } from '@/i18n/hooks'
import {
  announceTvReceiver,
  subscribeTv,
  type TvMessage,
  type TvSessionState,
  type TvSetupState,
} from '@/lib/tv/broadcast'
/**
 * Passive TV display surface. Listens for session state via BroadcastChannel
 * from the mobile controller. Open via Workout Prep → Test TV.
 */
export function TvPage() {
  useAutoThemeWatcher()
  const [state, setState] = useState<TvMessage | null>(null)

  useEffect(() => subscribeTv(setState), [])

  // Answer controller pings + announce on load so the controller can detect and
  // reconnect to this screen instead of opening a duplicate window.
  useEffect(() => announceTvReceiver(), [])

  useEffect(() => {
    if (state?.theme) {
      document.documentElement.dataset.theme = state.theme
    } else {
      applyTheme()
    }
  }, [state?.theme])

  const connected = state != null
  const sessionRest = connected && state.mode === 'session' ? state.rest : null

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-ink p-[2.5vh] text-fg">
      {!connected ? (
        <WaitingScreen />
      ) : state.mode === 'prep' ? (
        <PrepDashboard state={state} />
      ) : state.mode === 'setup' ? (
        <SetupDashboard state={state} />
      ) : state.mode === 'idle' ? (
        <IdleDashboard />
      ) : state.mode === 'summary' ? (
        <SummaryDashboard state={state} />
      ) : (
        <SessionDashboard state={state} />
      )}
      <TvRestTimer rest={sessionRest} />
    </div>
  )
}

function WaitingScreen() {
  const { t } = useTranslation('tv')
  return (
    <div className="grid flex-1 place-items-center">
      <div className="flex w-full max-w-[70vw] flex-col items-center gap-[3vh] text-center">
        <LogoMark size={120} />
        <h1 className="text-[5vh] font-bold leading-none tracking-tight">
          SOLO<span className="text-solo-400">.</span>
        </h1>
        <p className="label-mono text-[1.4vh] text-faint">{t('receiver')}</p>
        <p className="text-[1.8vh] text-muted">{t('waitingHint')}</p>
        <div className="mt-[2vh] flex items-center gap-[1.5vh] rounded-full border border-line bg-surface px-[3vh] py-[1.5vh]">
          <span className="size-[1.4vh] animate-pulse rounded-full bg-solo-400" />
          <p className="text-[1.6vh] text-muted">{t('waitingStatus')}</p>
        </div>
      </div>
    </div>
  )
}

function PrepDashboard({ state }: { state: Extract<TvMessage, { mode: 'prep' }> }) {
  const { t } = useTranslation('tv')
  return (
    <div className="mx-auto flex w-full max-w-[80vw] flex-1 flex-col justify-center gap-[3vh]">
      <header className="flex items-center justify-between">
        <div>
          <p className="label-mono text-[1.4vh] text-success">{t('connectedPrep')}</p>
          <h1 className="text-[4vh] font-bold">{t('workoutPrep')}</h1>
        </div>
        {state.garminConnected && state.recoveryScore != null && (
          <p className="text-[2vh] text-muted">{t('recoveryPct', { score: state.recoveryScore })}</p>
        )}
      </header>
      <ul className="grid gap-[1.5vh]">
        {state.workouts.map((w) => (
          <li
            key={w.id}
            className="rounded-[1.5vh] border border-line bg-surface px-[2.5vh] py-[2vh] text-[2.2vh]"
          >
            <span className="font-semibold">{w.name}</span>
            <span className="ml-[1vh] text-muted">· {t('exercisesCount', { count: w.exerciseCount })}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SetupDashboard({ state }: { state: TvSetupState }) {
  const { t } = useTranslation('tv')
  return (
    <div className="mx-auto flex h-full w-full max-w-[90vw] flex-col gap-[3vh] py-[1vh]">
      <header className="flex shrink-0 items-end justify-between gap-[2vh]">
        <div>
          <p className="label-mono text-[1.4vh] text-solo-300">{t('connectedSetup')}</p>
          <h1 className="text-[4.5vh] font-bold leading-tight">{t('prepare')}</h1>
          <p className="mt-[0.8vh] text-[2.4vh] text-muted">
            {state.workoutName}
            <span className="text-faint"> · {t('exercisesCount', { count: state.exerciseCount })}</span>
          </p>
        </div>
        {state.garminConnected && state.recoveryScore != null && (
          <p className="shrink-0 text-[2vh] text-muted">{t('recoveryPct', { score: state.recoveryScore })}</p>
        )}
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-[2vh]">
        <div className="rounded-[1.5vh] border border-solo-400/35 bg-solo-400/10 px-[3vh] py-[2vh]">
          <p className="text-[2.4vh] font-semibold text-solo-200">{t('setupMaterials')}</p>
          <p className="mt-[0.6vh] text-[1.8vh] text-muted">{t('setupHint')}</p>
        </div>

        {state.materials.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-[1.5vh] border border-line bg-surface px-[3vh] py-[4vh] text-center">
            <p className="text-[2.4vh] text-muted">{t('materialsEmpty')}</p>
          </div>
        ) : (
          <ul className="grid min-h-0 flex-1 content-start gap-[1.2vh] overflow-y-auto sm:grid-cols-2">
            {state.materials.map((line) => (
              <li
                key={line.id}
                className="flex items-center gap-[2vh] rounded-[1.5vh] border border-line bg-surface px-[2.5vh] py-[2vh]"
              >
                <EquipmentIcon category={line.category} size={48} className="shrink-0" />
                <span className="text-[2.4vh] font-semibold leading-tight">{line.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function IdleDashboard() {
  const { t } = useTranslation('tv')
  return (
    <div className="grid flex-1 place-items-center">
      <div className="flex w-full max-w-[70vw] flex-col items-center gap-[3vh] text-center">
        <LogoMark size={120} />
        <h1 className="text-[5vh] font-bold leading-none tracking-tight">
          SOLO<span className="text-solo-400">.</span>
        </h1>
        <p className="label-mono text-[1.4vh] text-success">{t('ready')}</p>
        <p className="text-[2.2vh] text-muted">{t('idleHint')}</p>
        <div className="mt-[2vh] flex items-center gap-[1.5vh] rounded-full border border-success/30 bg-success/10 px-[3vh] py-[1.5vh]">
          <span className="size-[1.4vh] rounded-full bg-success" />
          <p className="text-[1.6vh] text-success">{t('readyNext')}</p>
        </div>
      </div>
    </div>
  )
}

function SummaryDashboard({ state }: { state: Extract<TvMessage, { mode: 'summary' }> }) {
  const { t } = useTranslation('tv')
  const { mode: _mode, theme: _theme, updatedAt: _updatedAt, ...raw } = state
  const summary = normalizeSummary(raw)

  return (
    <div className="mx-auto flex h-full w-full max-w-[90vw] flex-col gap-[3vh] py-[2vh]">
      <header>
        <p className="label-mono text-[1.4vh] text-success">{t('workoutDone')}</p>
        <h1 className="text-[4vh] font-bold">{summary.workoutName}</h1>
        <p className="mt-[1vh] text-[2.4vh] text-muted">
          {t('totalTime')}{' '}
          <span className="font-mono font-bold text-fg">
            {formatDuration(summary.totalDurationSeconds)}
          </span>
        </p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <WorkoutSummary summary={summary} variant="tv" showHeader={false} />
      </div>
    </div>
  )
}

function SessionDashboard({ state }: { state: TvSessionState }) {
  const { t } = useTranslation('tv')
  const visual = resolveExerciseVisual({
    name: state.exerciseName,
    kind: state.exerciseKind,
    metric: state.metric ?? 'reps',
    equipment: state.equipment ?? [],
    icon: state.icon,
    media: state.exerciseMedia,
  })

  const progress = state.progressPercent
  const restActive = Boolean(state.rest?.active)
  const showExerciseTimer =
    state.metric === 'time' && !restActive && Boolean(state.exerciseTimerActive)
  const timerStartedAt = state.exerciseStartedAt
    ? new Date(state.exerciseStartedAt).getTime()
    : null
  const exerciseTimer = useElapsedTimer(timerStartedAt, showExerciseTimer)

  return (
    <div className="mx-auto flex h-full w-full max-w-[120rem] flex-col gap-[2vh]">
      <header className="flex shrink-0 items-center justify-between gap-[2vh]">
        <div>
          <p className="label-mono text-[1.4vh] text-success">{t('liveSession')}</p>
          <h1 className="text-[3vh] font-bold leading-tight">{state.workoutName}</h1>
        </div>
        <div className="text-right">
          {state.sensor.garminConnected && state.recoveryScore != null && (
            <p className="text-[1.6vh] text-muted">{t('recoveryPct', { score: state.recoveryScore })}</p>
          )}
          <p className="text-[1.4vh] text-faint">
            {state.completedSlots}/{state.totalSlots} · {state.phaseLabel}{' '}
            {state.setIndex + 1}/{state.totalSets}
          </p>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[1.3fr_1fr] gap-[2vh]">
        <div className="flex min-h-0 flex-col gap-[1.5vh]">
          <div className="min-h-0 flex-[3]">
            <TvExerciseVisual visual={visual} />
          </div>
          {state.exerciseDescription && (
            <div className="flex min-h-0 flex-[2] flex-col rounded-[1.5vh] border border-line bg-surface p-[1.5vh]">
              <p className="label-mono shrink-0 text-[1.2vh] text-faint">{t('instructions')}</p>
              <MarkdownText
                content={state.exerciseDescription}
                variant="tv"
                className="mt-[1vh] min-h-0 flex-1 overflow-hidden"
              />
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-col gap-[1.5vh]">
          <div className="shrink-0 rounded-[1.5vh] border border-line bg-surface p-[2vh]">
            <p className="label-mono text-[1.2vh] text-faint">{t('nowActive')}</p>
            <p className="mt-[0.5vh] text-[3.6vh] font-bold leading-tight text-solo-300">
              {state.exerciseName}
            </p>
            <div className="mt-[1.5vh] flex flex-wrap gap-[2vh] text-[2vh]">
              <span>
                {state.phaseLabel} {state.setIndex + 1}/{state.totalSets}
              </span>
              <span className="text-muted">{state.targetLabel}</span>
              {state.weightKg != null && state.weightKg > 0 && (
                <span className="font-mono font-bold">{state.weightKg} kg</span>
              )}
            </div>
            {state.nextExerciseName && !restActive && (
              <p className="mt-[1.5vh] text-[1.6vh] text-muted">
                {t('nextColon')} <span className="text-fg">{state.nextExerciseName}</span>
              </p>
            )}
          </div>

          {showExerciseTimer && (
            <div className="flex shrink-0 flex-col items-center justify-center rounded-[1.5vh] border border-solo-400/35 bg-solo-400/10 px-[2vh] py-[2.5vh]">
              <p className="label-mono text-[1.4vh] text-solo-300">{t('time')}</p>
              <p className="mt-[0.5vh] font-mono text-[14vh] font-bold leading-none tabular-nums tracking-tight text-solo-300">
                {exerciseTimer.formatted}
              </p>
              <p className="mt-[1.5vh] text-[2vh] text-muted">{t('target', { label: state.targetLabel })}</p>
            </div>
          )}

          <div className="min-h-0 flex-1">
            <TvCameraPanel enabled={state.sensor.cameraEnabled} />
          </div>

          <div className="shrink-0 rounded-[1.5vh] border border-line bg-surface p-[1.5vh]">
            <div className="mb-[1vh] flex items-center justify-between text-[1.4vh] text-muted">
              <span>
                {t('progressSlots', { done: state.completedSlots, total: state.totalSlots })}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-[1vh] overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-solo-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0">
        <TvSensorStrip sensor={state.sensor} />
      </div>
    </div>
  )
}
