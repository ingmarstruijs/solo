import { useEffect, useState } from 'react'
import { LogoMark } from '@/components/Logo'
import { TvCameraPanel } from '@/components/tv/TvCoachOverlay'
import { TvRestTimer } from '@/components/tv/TvRestTimer'
import { TvExerciseVisual } from '@/components/tv/TvExerciseVisual'
import { TvSensorStrip } from '@/components/tv/TvSensorStrip'
import { WorkoutSummary } from '@/components/session/WorkoutSummary'
import { MarkdownText } from '@/components/MarkdownText'
import { useAutoThemeWatcher } from '@/hooks/useTheme'
import { formatDuration, normalizeSummary } from '@/lib/workout/sessionSummary'
import { resolveExerciseVisual } from '@/lib/tv/exerciseMedia'
import { applyTheme } from '@/lib/theme/themes'
import { announceTvReceiver, subscribeTv, type TvMessage, type TvSessionState } from '@/lib/tv/broadcast'
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

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-ink p-[2.5vh] text-fg">
      {!connected ? (
        <WaitingScreen />
      ) : state.mode === 'prep' ? (
        <PrepDashboard state={state} />
      ) : state.mode === 'idle' ? (
        <IdleDashboard />
      ) : state.mode === 'summary' ? (
        <SummaryDashboard state={state} />
      ) : (
        <SessionDashboard state={state} />
      )}
    </div>
  )
}

function WaitingScreen() {
  return (
    <div className="grid flex-1 place-items-center">
      <div className="flex w-full max-w-[70vw] flex-col items-center gap-[3vh] text-center">
        <LogoMark size={120} />
        <h1 className="text-[5vh] font-bold leading-none tracking-tight">
          SOLO<span className="text-solo-400">.</span>
        </h1>
        <p className="label-mono text-[1.4vh] text-faint">TV receiver</p>
        <p className="text-[1.8vh] text-muted">
          Open Workout Prep op je telefoon en tik <strong>Test TV</strong>, of open deze pagina op
          je TV-scherm.
        </p>
        <div className="mt-[2vh] flex items-center gap-[1.5vh] rounded-full border border-line bg-surface px-[3vh] py-[1.5vh]">
          <span className="size-[1.4vh] animate-pulse rounded-full bg-solo-400" />
          <p className="text-[1.6vh] text-muted">Wacht op verbinding…</p>
        </div>
      </div>
    </div>
  )
}

function PrepDashboard({ state }: { state: Extract<TvMessage, { mode: 'prep' }> }) {
  return (
    <div className="mx-auto flex w-full max-w-[80vw] flex-1 flex-col justify-center gap-[3vh]">
      <header className="flex items-center justify-between">
        <div>
          <p className="label-mono text-[1.4vh] text-success">VERBONDEN · PREP</p>
          <h1 className="text-[4vh] font-bold">Workout Prep</h1>
        </div>
        <p className="text-[2vh] text-muted">Recovery {state.recoveryScore}%</p>
      </header>
      <ul className="grid gap-[1.5vh]">
        {state.workouts.map((w) => (
          <li
            key={w.id}
            className="rounded-[1.5vh] border border-line bg-surface px-[2.5vh] py-[2vh] text-[2.2vh]"
          >
            <span className="font-semibold">{w.name}</span>
            <span className="ml-[1vh] text-muted">· {w.exerciseCount} oefeningen</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function IdleDashboard() {
  return (
    <div className="grid flex-1 place-items-center">
      <div className="flex w-full max-w-[70vw] flex-col items-center gap-[3vh] text-center">
        <LogoMark size={120} />
        <h1 className="text-[5vh] font-bold leading-none tracking-tight">
          SOLO<span className="text-solo-400">.</span>
        </h1>
        <p className="label-mono text-[1.4vh] text-success">KLAAR</p>
        <p className="text-[2.2vh] text-muted">
          Wacht op de volgende workout vanaf je telefoon.
        </p>
        <div className="mt-[2vh] flex items-center gap-[1.5vh] rounded-full border border-success/30 bg-success/10 px-[3vh] py-[1.5vh]">
          <span className="size-[1.4vh] rounded-full bg-success" />
          <p className="text-[1.6vh] text-success">Klaar voor volgende workout</p>
        </div>
      </div>
    </div>
  )
}

function SummaryDashboard({ state }: { state: Extract<TvMessage, { mode: 'summary' }> }) {
  const { mode: _mode, theme: _theme, updatedAt: _updatedAt, ...raw } = state
  const summary = normalizeSummary(raw)

  return (
    <div className="mx-auto flex h-full w-full max-w-[90vw] flex-col gap-[3vh] py-[2vh]">
      <header>
        <p className="label-mono text-[1.4vh] text-success">WORKOUT AFGEROND</p>
        <h1 className="text-[4vh] font-bold">{summary.workoutName}</h1>
        <p className="mt-[1vh] text-[2.4vh] text-muted">
          Totale tijd{' '}
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
  const visual = resolveExerciseVisual({
    name: state.exerciseName,
    kind: state.exerciseKind,
    metric: state.metric ?? 'reps',
    equipment: state.equipment ?? [],
    icon: state.icon,
    media: state.exerciseMedia,
  })

  const progress = state.progressPercent

  return (
    <div className="mx-auto flex h-full w-full max-w-[120rem] flex-col gap-[2vh]">
      <header className="flex shrink-0 items-center justify-between gap-[2vh]">
        <div>
          <p className="label-mono text-[1.4vh] text-success">LIVE SESSIE</p>
          <h1 className="text-[3vh] font-bold leading-tight">{state.workoutName}</h1>
        </div>
        <div className="text-right">
          <p className="text-[1.6vh] text-muted">Recovery {state.recoveryScore ?? '—'}%</p>
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
              <p className="label-mono shrink-0 text-[1.2vh] text-faint">Uitleg</p>
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
            <p className="label-mono text-[1.2vh] text-faint">Nu bezig</p>
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
            {state.nextExerciseName && (
              <p className="mt-[1.5vh] text-[1.6vh] text-muted">
                Volgende: <span className="text-fg">{state.nextExerciseName}</span>
              </p>
            )}
          </div>

          <div className="min-h-0 flex-1">
            <TvCameraPanel enabled={state.sensor.cameraEnabled} />
          </div>

          <div className="shrink-0 rounded-[1.5vh] border border-line bg-surface p-[1.5vh]">
            <div className="mb-[1vh] flex items-center justify-between text-[1.4vh] text-muted">
              <span>
                Voortgang · {state.completedSlots}/{state.totalSlots}
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
        <TvRestTimer rest={state.rest} />
      </div>
      <div className="shrink-0">
        <TvSensorStrip sensor={state.sensor} />
      </div>
    </div>
  )
}
