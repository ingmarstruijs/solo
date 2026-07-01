import {
  Check,
  ChevronRight,
  Mic,
  Pause,
  Play,
  Scale,
  Square,
  TimerReset,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActiveSession } from '@/hooks/useActiveSession'
import { useCameraEnabled } from '@/hooks/useCameraEnabled'
import { useCoachEnabled } from '@/hooks/useCoachEnabled'
import { useGarminConnected } from '@/hooks/useGarminConnected'
import { useRecoveryScore } from '@/hooks/useRecoveryScore'
import { useSessionActions } from '@/hooks/useSessionActions'
import { useTheme } from '@/hooks/useTheme'
import { loadWorkoutQueue, popNextQueuedWorkout } from '@/lib/workout/sessionPrep'
import { useTvConnection } from '@/hooks/useTvConnection'
import { useCoachAnnouncement } from '@/hooks/useCoachVoice'
import { useRestCountdown, type RestTimer } from '@/hooks/useRestCountdown'
import { SessionControlBar } from '@/components/session/SessionControlBar'
import { SessionMaterialsChecklist } from '@/components/session/SessionMaterialsChecklist'
import { RestTimerBar } from '@/components/session/RestTimerBar'
import { ExerciseInfoModal } from '@/components/workout/ExerciseInfoModal'
import { buildSessionTvState, buildSummaryTvState } from '@/lib/tv/broadcast'
import { publishToTvTransport, publishTvIdle, reconnectTv, disconnectTv } from '@/lib/tv/transport'
import { buildSessionSummary, saveLastSummary } from '@/lib/workout/sessionSummary'
import { advanceToNextSet } from '@/lib/storage/sessionStore'
import {
  buildCompletionAnnouncement,
  formatExerciseTargetLine,
  getExerciseWeight,
} from '@/lib/tv/coachEngine'
import { getPhaseInfo, getPhaseRestSeconds } from '@/lib/workout/workoutStructure'
import { collectWorkoutMaterials } from '@/lib/workout/sessionMaterials'
import { ExerciseIcon } from '@/components/workout/ExerciseIcon'
import { WeightAssistant } from '@/components/workout/WeightAssistant'
import { useRestCoach } from '@/hooks/useRestCoach'
import { useElapsedTimer } from '@/hooks/useElapsedTimer'
import { formatRestSeconds } from '@/hooks/useRestCountdown'
import { cn } from '@/lib/cn'

export function SessionPage() {
  const navigate = useNavigate()
  const { session } = useActiveSession()
  const {
    toggleComplete,
    setNote,
    cancelSession,
    completeSession,
    startNextWorkout,
    startExercises,
    togglePause,
  } = useSessionActions()
  const { score: recoveryScore } = useRecoveryScore()
  const { connected: garminConnected } = useGarminConnected()
  const { theme } = useTheme()
  const { enabled: coachEnabled, toggleEnabled: toggleCoach } = useCoachEnabled()
  const { enabled: cameraEnabled, setEnabled: setCameraEnabled } = useCameraEnabled()
  const { status: tvStatus } = useTvConnection()
  const listRef = useRef<HTMLOListElement>(null)
  const announcedSessionStartRef = useRef<string | null>(null)
  const [coachAnnouncement, setCoachAnnouncement] = useState<{
    text: string
    key: string
  } | null>(null)
  const [restTimer, setRestTimer] = useState<RestTimer | null>(null)
  const restCountdown = useRestCountdown(restTimer)
  useRestCoach(restCountdown, restTimer && restCountdown.active ? restTimer : null, coachEnabled)
  const queue = useMemo(() => loadWorkoutQueue(), [session?.workout.id])

  const exercisesStarted = session?.exercisesStarted ?? Boolean(session?.currentExerciseStartedAt)

  const sessionMaterials = useMemo(
    () => (session ? collectWorkoutMaterials(session.workout, session.targets) : []),
    [session],
  )

  const activeIndex = useMemo(() => {
    if (!session) return 0
    const next = session.workout.exercises.findIndex(
      (ex) => !session.completedExerciseIds.includes(ex.id),
    )
    return next >= 0 ? next : session.workout.exercises.length - 1
  }, [session])

  const sessionTv = useMemo(() => {
    if (!session) return null
    const rest =
      restTimer && restCountdown.active
        ? {
            active: true,
            endsAt: new Date(restTimer.endsAt).toISOString(),
            totalSeconds: restTimer.totalSeconds,
            afterExerciseName: restTimer.afterExerciseName,
            kind: restTimer.kind,
            phaseLabel: restTimer.phaseLabel,
          }
        : { active: false, endsAt: null, totalSeconds: 0 }

    return buildSessionTvState(
      session.workout,
      session.targets,
      activeIndex,
      session.currentSet - 1,
      recoveryScore,
      theme,
      {
        cameraEnabled,
        sessionStartedAt: session.startedAt,
        completedExerciseIds: session.completedExerciseIds,
        coachEnabled,
        rest,
      },
    )
  }, [
    session,
    activeIndex,
    recoveryScore,
    theme,
    cameraEnabled,
    coachEnabled,
    restTimer,
    restCountdown.active,
    garminConnected,
  ])

  useCoachAnnouncement(
    coachAnnouncement?.text ?? null,
    coachAnnouncement?.key ?? '',
    coachEnabled,
  )

  useEffect(() => {
    if (!session || !coachEnabled || !exercisesStarted) return
    if (session.completedExerciseIds.length > 0) return
    if (session.currentSet !== 1) return

    const announceKey = `${session.startedAt}-${session.workout.id}-started`
    if (announcedSessionStartRef.current === announceKey) return
    announcedSessionStartRef.current = announceKey

    const text = buildCompletionAnnouncement(session)
    if (!text) return
    setCoachAnnouncement({ text, key: `session-start-${announceKey}` })
  }, [session, coachEnabled, exercisesStarted])

  useEffect(() => {
    if (!sessionTv) return
    publishToTvTransport(sessionTv, { theme })
  }, [sessionTv, theme])

  useEffect(() => {
    if (restTimer && !restCountdown.active) setRestTimer(null)
  }, [restTimer, restCountdown.active])

  if (!session) {
    return (
      <section className="flex flex-col gap-5 py-2">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-surface-2 text-solo-400">
            <Play className="size-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Sessie</h1>
            <p className="text-xs text-muted">Geen actieve workout</p>
          </div>
        </div>
        <p className="text-sm text-muted">
          Kies een workout en ga via <strong>Workout Prep</strong> naar start.
        </p>
        <button
          type="button"
          onClick={() => navigate('/workouts')}
          className="rounded-xl bg-solo-400 py-3 text-sm font-semibold text-ink active:bg-solo-500"
        >
          Naar workouts
        </button>
      </section>
    )
  }

  const activeSession = session
  const { workout, targets, completedExerciseIds, currentSet } = activeSession
  const pausedIds = new Set(activeSession.pausedExerciseIds ?? [])
  const phase = getPhaseInfo(workout)
  const doneCount = completedExerciseIds.length
  const allDone = doneCount === workout.exercises.length
  const isLastPhase = currentSet >= phase.total
  const phaseRestSeconds = getPhaseRestSeconds(workout)
  const activeExercise = workout.exercises[activeIndex]

  function handleCoachToggle() {
    const turningOn = !coachEnabled
    toggleCoach()
    if (turningOn && exercisesStarted && !allDone) {
      const text = buildCompletionAnnouncement(activeSession)
      if (text) {
        setCoachAnnouncement({
          text,
          key: `coach-on-${activeSession.currentSet}-${activeIndex}-${Date.now()}`,
        })
      }
    }
  }

  function handleMarkDone(exerciseId: string) {
    if (!exercisesStarted || completedExerciseIds.includes(exerciseId)) return
    toggleComplete(exerciseId)
    if (coachEnabled) {
      const projected = {
        ...activeSession,
        completedExerciseIds: [...completedExerciseIds, exerciseId],
      }
      setCoachAnnouncement({
        text: buildCompletionAnnouncement(projected),
        key: `done-${exerciseId}-${projected.completedExerciseIds.length}`,
      })
    }
  }

  function handleStartRest() {
    const ex = workout.exercises[activeIndex]
    if (!ex || ex.restSeconds <= 0 || restCountdown.active) return
    setRestTimer({
      id: `${ex.id}-${Date.now()}`,
      endsAt: Date.now() + ex.restSeconds * 1000,
      totalSeconds: ex.restSeconds,
      afterExerciseName: ex.name,
      kind: 'exercise',
    })
  }

  function handleStartPhaseRest() {
    if (phaseRestSeconds <= 0 || restCountdown.active) return
    setRestTimer({
      id: `phase-${currentSet}-${Date.now()}`,
      endsAt: Date.now() + phaseRestSeconds * 1000,
      totalSeconds: phaseRestSeconds,
      afterExerciseName: workout.name,
      kind: 'phase',
      phaseLabel: phase.label,
    })
  }

  function handleUndo(exerciseId: string) {
    if (!completedExerciseIds.includes(exerciseId)) return
    toggleComplete(exerciseId)
    setRestTimer(null)
  }

  function handleCancel() {
    if (!confirm('Sessie afbreken? Deze workout wordt niet opgeslagen.')) return
    publishTvIdle(theme)
    cancelSession()
    navigate('/workouts')
  }

  function handleNextSet() {
    if (!allDone) return
    setRestTimer(null)
    const nextSet = currentSet + 1
    advanceToNextSet()
    if (coachEnabled) {
      const text = buildCompletionAnnouncement({
        ...activeSession,
        currentSet: nextSet,
        completedExerciseIds: [],
      })
      if (text) {
        setCoachAnnouncement({ text, key: `next-set-${nextSet}-${Date.now()}` })
      }
    }
  }

  function handleFinish() {
    const summary = buildSessionSummary(activeSession)
    saveLastSummary(summary, false)
    publishToTvTransport(buildSummaryTvState(summary, theme), { theme })
    completeSession(summary)
    navigate('/session/summary', { state: { summary, hasNextWorkout: false } })
  }

  function handleNextWorkout() {
    const summary = buildSessionSummary(activeSession)
    completeSession(summary)
    const next = popNextQueuedWorkout()
    if (!next) {
      saveLastSummary(summary, false)
      publishToTvTransport(buildSummaryTvState(summary, theme), { theme })
      navigate('/session/summary', { state: { summary, hasNextWorkout: false } })
      return
    }
    setRestTimer(null)
    announcedSessionStartRef.current = null
    startNextWorkout(next)
  }

  function handleConnectTv() {
    if (!sessionTv) return
    void reconnectTv(sessionTv, { theme })
  }

  function handleDisconnectTv() {
    publishTvIdle(theme)
    disconnectTv()
  }

  const showActiveSticky =
    exercisesStarted && activeExercise && !allDone && !completedExerciseIds.includes(activeExercise.id)

  return (
    <section className="flex h-[calc(100dvh-var(--header-h)-var(--bottomnav-h)-env(safe-area-inset-top)-env(safe-area-inset-bottom)-0.5rem)] flex-col gap-2 pt-1">
      <header className="flex shrink-0 items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="label-mono text-[10px] text-success">● Live</p>
          <h1 className="truncate text-base font-bold">{workout.name}</h1>
          <p className="text-[10px] text-muted">
            {phase.label} {currentSet}/{phase.total} · {doneCount}/{workout.exercises.length}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-danger/40 bg-danger/10 text-danger active:bg-danger/20"
          aria-label="Stop sessie"
        >
          <Square className="size-5 fill-current" />
        </button>
      </header>

      <SessionControlBar
        cameraEnabled={cameraEnabled}
        onCameraChange={setCameraEnabled}
        coachEnabled={coachEnabled}
        onCoachToggle={handleCoachToggle}
        tvStatus={tvStatus}
        onConnectTv={handleConnectTv}
        onDisconnectTv={handleDisconnectTv}
      />

      <RestTimerBar countdown={restCountdown} onSkip={() => setRestTimer(null)} className="shrink-0" />

      {!exercisesStarted && (
        <div className="shrink-0 rounded-card border border-solo-400/40 bg-solo-400/10 p-4">
          <p className="text-sm font-semibold">Klaar om te beginnen?</p>
          <p className="mt-1 text-xs text-muted">
            Stel camera, coach en TV in. Leg je materiaal klaar en druk op start voor de eerste
            oefening.
          </p>
          <SessionMaterialsChecklist materials={sessionMaterials} />
          <button
            type="button"
            onClick={startExercises}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-solo-400 py-3.5 text-sm font-bold text-ink active:bg-solo-500"
          >
            <Play className="size-5 fill-ink" />
            Start workout
          </button>
        </div>
      )}

      {showActiveSticky && (
        <div className="shrink-0 rounded-card border-2 border-solo-400 bg-solo-400/[0.08] p-3 shadow-lg shadow-solo-400/10">
          <SessionExerciseRow
            ex={activeExercise}
            index={activeIndex}
            weight={getExerciseWeight(activeExercise, targets)}
            done={false}
            isCurrent
            isPaused={pausedIds.has(activeExercise.id)}
            exercisesStarted
            reason={targets.find((t) => t.exerciseId === activeExercise.id)?.reason}
            plateConfig={targets.find((t) => t.exerciseId === activeExercise.id)?.plateConfig}
            note={activeSession.exerciseNotes[activeExercise.id]}
            exerciseStartedAt={activeSession.currentExerciseStartedAt ?? activeSession.startedAt}
            restSeconds={activeExercise.restSeconds}
            restActive={restCountdown.active}
            onStartRest={handleStartRest}
            onMarkDone={() => handleMarkDone(activeExercise.id)}
            onUndo={() => handleUndo(activeExercise.id)}
            onTogglePause={() => togglePause(activeExercise.id)}
            onNoteChange={(n) => setNote(activeExercise.id, n)}
            compact={false}
            sticky
          />
        </div>
      )}

      {queue.length > 0 && (
        <p className="shrink-0 truncate text-[10px] text-faint">
          Wachtrij: {queue.map((q) => q.workout.name).join(' → ')}
        </p>
      )}

      {exercisesStarted && allDone && !isLastPhase && (
        <div className="flex shrink-0 items-stretch gap-2">
          {phaseRestSeconds > 0 && (
            <button
              type="button"
              onClick={handleStartPhaseRest}
              disabled={restCountdown.active}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2.5 text-sm font-bold',
                restCountdown.active ? 'bg-calm/20 text-calm' : 'bg-calm text-ink active:opacity-90',
              )}
            >
              <TimerReset className="size-4" />
              Rust {formatRestSeconds(phaseRestSeconds)}
            </button>
          )}
          <button
            type="button"
            onClick={handleNextSet}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-solo-400/40 bg-solo-400/10 py-2.5 text-sm font-bold text-solo-300"
          >
            Volgende {phase.label.toLowerCase()}
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}

      {exercisesStarted && allDone && isLastPhase && (
        queue.length > 0 ? (
          <button
            type="button"
            onClick={handleNextWorkout}
            className="flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl bg-solo-400 py-3 text-sm font-bold text-ink active:bg-solo-500"
          >
            <span className="flex items-center gap-2">
              Volgende workout
              <ChevronRight className="size-5" />
            </span>
            <span className="text-xs font-medium text-ink/80">{queue[0].workout.name}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-success py-3 text-sm font-bold text-ink"
          >
            <Check className="size-5" />
            Workout afronden
          </button>
        )
      )}

      <ol ref={listRef} className="-mx-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-1 pb-2">
        {workout.exercises.map((ex, i) => {
          const weight = getExerciseWeight(ex, targets)
          const done = completedExerciseIds.includes(ex.id)
          const isCurrent = exercisesStarted && i === activeIndex && !allDone
          const isPaused = pausedIds.has(ex.id)
          const target = targets.find((t) => t.exerciseId === ex.id)
          const hideDuplicate = showActiveSticky && isCurrent

          if (hideDuplicate) return null

          return (
            <li
              key={ex.id}
              className={cn(
                'rounded-card border bg-surface p-3 transition-all',
                done && 'border-success/30 opacity-60',
                !done && !isCurrent && 'border-line',
                isCurrent && 'border-solo-400/50 bg-solo-400/[0.04]',
              )}
            >
              <SessionExerciseRow
                ex={ex}
                index={i}
                weight={weight}
                done={done}
                isCurrent={isCurrent}
                isPaused={isPaused}
                exercisesStarted={exercisesStarted}
                reason={target?.reason}
                plateConfig={target?.plateConfig}
                note={activeSession.exerciseNotes[ex.id]}
                exerciseStartedAt={activeSession.currentExerciseStartedAt ?? activeSession.startedAt}
                restSeconds={ex.restSeconds}
                restActive={restCountdown.active}
                onStartRest={handleStartRest}
                onMarkDone={() => handleMarkDone(ex.id)}
                onUndo={() => handleUndo(ex.id)}
                onTogglePause={() => togglePause(ex.id)}
                onNoteChange={(n) => setNote(ex.id, n)}
                compact
              />
            </li>
          )
        })}
      </ol>
    </section>
  )
}

type SessionExerciseRowProps = {
  ex: import('@/types/workout').WorkoutExercise
  index: number
  weight: number
  done: boolean
  isCurrent: boolean
  isPaused: boolean
  exercisesStarted: boolean
  reason?: string
  plateConfig?: import('@/types/workout').PlateConfig
  note?: { audioNote?: string; audioNoteText?: string }
  exerciseStartedAt: string
  restSeconds: number
  restActive: boolean
  onStartRest: () => void
  onMarkDone: () => void
  onUndo: () => void
  onTogglePause: () => void
  onNoteChange: (note: { audioNote?: string; audioNoteText?: string }) => void
  compact?: boolean
  sticky?: boolean
}

function SessionExerciseRow({
  ex,
  index,
  weight,
  done,
  isCurrent,
  isPaused,
  exercisesStarted,
  reason,
  plateConfig,
  note,
  exerciseStartedAt,
  restSeconds,
  restActive,
  onStartRest,
  onMarkDone,
  onUndo,
  onTogglePause,
  onNoteChange,
  compact,
  sticky,
}: SessionExerciseRowProps) {
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [showWeight, setShowWeight] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const timerActive = isCurrent && !done && exercisesStarted && !isPaused
  const exerciseTimer = useElapsedTimer(new Date(exerciseStartedAt).getTime(), timerActive)

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        onNoteChange({ ...note, audioNote: URL.createObjectURL(blob) })
        stream.getTracks().forEach((t) => t.stop())
      }
      recorder.start()
      mediaRef.current = recorder
    } catch {
      const text = prompt('Microfoon niet beschikbaar. Typ je notitie:')
      if (text) onNoteChange({ ...note, audioNoteText: text })
    }
  }

  function stopRecording() {
    mediaRef.current?.stop()
    mediaRef.current = null
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-lg',
            done ? 'bg-success/15 text-success' : isCurrent ? 'bg-solo-400/20 text-solo-300' : 'bg-surface-2',
          )}
        >
          {done ? (
            <Check className="size-5" strokeWidth={3} />
          ) : (
            <ExerciseIcon metric={ex.metric} kind={ex.kind} equipment={ex.equipment} icon={ex.icon} size={22} />
          )}
        </span>

        <div className="min-w-0 flex-1">
          {isCurrent && !done && exercisesStarted && (
            <span
              className={cn(
                'mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                isPaused ? 'bg-warn/20 text-warn' : 'bg-solo-400 text-ink',
              )}
            >
              {!isPaused && <span className="size-1.5 animate-pulse rounded-full bg-ink" />}
              {isPaused ? 'Gepauzeerd' : sticky ? 'Nu bezig' : 'Actief'}
            </span>
          )}
          <div className="flex items-start justify-between gap-2">
            <p className={cn('min-w-0 font-semibold', done && 'text-success', sticky && 'text-base')}>
              {ex.name}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              {timerActive && (
                <span className="font-mono text-sm font-bold tabular-nums text-solo-400">
                  {exerciseTimer.formatted}
                </span>
              )}
              {isPaused && isCurrent && (
                <span className="font-mono text-sm text-warn">⏸</span>
              )}
              <span className={cn('label-mono text-faint', isCurrent && 'text-solo-400')}>#{index + 1}</span>
            </div>
          </div>
          <p className="mt-0.5 text-xs text-muted">{formatExerciseTargetLine(ex, weight)}</p>
          {reason && <p className="mt-1 text-xs text-warn">{reason}</p>}
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
      </div>

      {(isCurrent || note?.audioNote || note?.audioNoteText || plateConfig) && exercisesStarted && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className="flex items-center gap-1 rounded-lg border border-line px-2 py-1.5 text-[10px] text-muted active:bg-surface-2"
          >
            <Mic className="size-3.5" />
            {note?.audioNote || note?.audioNoteText ? 'Notitie ✓' : 'Audio'}
          </button>
          {plateConfig && weight > 0 && (
            <button
              type="button"
              onClick={() => setShowWeight((v) => !v)}
              className="flex items-center gap-1 rounded-lg border border-line px-2 py-1.5 text-[10px] text-solo-400 active:bg-surface-2"
            >
              <Scale className="size-3.5" />
              Gewichten
            </button>
          )}
        </div>
      )}

      {note?.audioNote && <audio src={note.audioNote} controls className="h-8 w-full" />}
      {note?.audioNoteText && <p className="text-xs italic text-muted">"{note.audioNoteText}"</p>}
      {showWeight && plateConfig && <WeightAssistant exerciseName={ex.name} config={plateConfig} />}

      {isCurrent && !done && exercisesStarted && (
        <div className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={onTogglePause}
            className={cn(
              'flex min-h-11 flex-col items-center justify-center rounded-xl border px-3 text-xs font-bold',
              isPaused
                ? 'border-solo-400/50 bg-solo-400/10 text-solo-300'
                : 'border-line bg-surface-2 text-muted',
            )}
          >
            {isPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
            {isPaused ? 'Hervat' : 'Pauze'}
          </button>
          {restSeconds > 0 && (
            <button
              type="button"
              onClick={onStartRest}
              disabled={restActive || isPaused}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2.5 text-sm font-bold',
                restActive ? 'bg-calm/20 text-calm' : 'bg-calm text-ink active:opacity-90',
                isPaused && 'opacity-50',
              )}
            >
              <TimerReset className="size-4" />
              Rust {formatRestSeconds(restSeconds)}
            </button>
          )}
          <button
            type="button"
            onClick={onMarkDone}
            disabled={isPaused}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl bg-success py-2.5 text-sm font-bold text-ink',
              isPaused && 'opacity-50',
            )}
          >
            <Check className="size-4" strokeWidth={3} />
            Klaar
          </button>
        </div>
      )}

      {done && !compact && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2">
          <span className="flex items-center gap-2 text-sm font-semibold text-success">
            <Check className="size-4" strokeWidth={3} />
            Afgevinkt
          </span>
          <button type="button" onClick={onUndo} className="text-xs font-medium text-muted">
            Ongedaan
          </button>
        </div>
      )}

      {showInfo && ex.description && (
        <ExerciseInfoModal name={ex.name} description={ex.description} onClose={() => setShowInfo(false)} />
      )}
    </div>
  )
}
