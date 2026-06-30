import { Check, ChevronRight, Info, Mic, Play, Scale, Square, TimerReset } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActiveSession } from '@/hooks/useActiveSession'
import { useRecoveryScore } from '@/hooks/useRecoveryScore'
import { useSessionActions } from '@/hooks/useSessionActions'
import { useTheme } from '@/hooks/useTheme'
import { loadWorkoutQueue } from '@/lib/workout/sessionPrep'
import { useCoachEnabled } from '@/hooks/useCoachEnabled'
import { useTvConnection } from '@/hooks/useTvConnection'
import { useCoachAnnouncement } from '@/hooks/useCoachVoice'
import { useRestCountdown, type RestTimer } from '@/hooks/useRestCountdown'
import { SessionControlBar } from '@/components/session/SessionControlBar'
import { RestTimerBar } from '@/components/session/RestTimerBar'
import { buildSessionTvState, buildSummaryTvState } from '@/lib/tv/broadcast'
import { publishToTvTransport, publishTvIdle, reconnectTv, disconnectTv } from '@/lib/tv/transport'
import {
  buildSessionSummary,
  saveLastSummary,
} from '@/lib/workout/sessionSummary'
import { advanceToNextSet } from '@/lib/storage/sessionStore'
import {
  buildCompletionAnnouncement,
  formatExerciseTargetLine,
  getExerciseWeight,
} from '@/lib/tv/coachEngine'
import { getPhaseInfo, getPhaseRestSeconds } from '@/lib/workout/workoutStructure'
import { ExerciseIcon } from '@/components/workout/ExerciseIcon'
import { ExerciseInfoModal } from '@/components/workout/ExerciseInfoModal'
import { WeightAssistant } from '@/components/workout/WeightAssistant'
import { useRestCoach } from '@/hooks/useRestCoach'
import { useElapsedTimer } from '@/hooks/useElapsedTimer'
import { formatRestSeconds } from '@/hooks/useRestCountdown'
import { cn } from '@/lib/cn'

export function SessionPage() {
  const navigate = useNavigate()
  const { session } = useActiveSession()
  const { toggleComplete, setNote, cancelSession, completeSession } = useSessionActions()
  const { score: recoveryScore } = useRecoveryScore()
  const { theme } = useTheme()
  const { enabled: coachEnabled, toggleEnabled: toggleCoach } = useCoachEnabled()
  const { status: tvStatus } = useTvConnection()
  const activeRowRef = useRef<HTMLLIElement>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const announcedSessionStartRef = useRef<string | null>(null)
  const [sensorEnabled, setSensorEnabled] = useState(false)
  const [coachAnnouncement, setCoachAnnouncement] = useState<{
    text: string
    key: string
  } | null>(null)
  const [restTimer, setRestTimer] = useState<RestTimer | null>(null)
  const restCountdown = useRestCountdown(restTimer)
  useRestCoach(restCountdown, restTimer && restCountdown.active ? restTimer : null, coachEnabled)
  const queue = useMemo(() => loadWorkoutQueue(), [session?.workout.id])

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
        cameraEnabled: sensorEnabled,
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
    sensorEnabled,
    coachEnabled,
    restTimer,
    restCountdown.active,
  ])

  useCoachAnnouncement(
    coachAnnouncement?.text ?? null,
    coachAnnouncement?.key ?? '',
    coachEnabled,
  )

  useEffect(() => {
    if (!session || !coachEnabled) return
    if (session.completedExerciseIds.length > 0) return
    if (session.currentSet !== 1) return

    const announceKey = `${session.startedAt}-${session.workout.id}`
    if (announcedSessionStartRef.current === announceKey) return
    announcedSessionStartRef.current = announceKey

    const text = buildCompletionAnnouncement(session)
    if (!text) return
    setCoachAnnouncement({
      text,
      key: `session-start-${announceKey}`,
    })
  }, [session, coachEnabled])

  useEffect(() => {
    if (!sessionTv) return
    publishToTvTransport(sessionTv, { theme })
  }, [sessionTv, theme])

  useEffect(() => {
    if (!session) return

    const frame = requestAnimationFrame(() => {
      const list = listRef.current
      const row = activeRowRef.current
      if (!list || !row) return

      const target = row.offsetTop - (list.clientHeight - row.offsetHeight) / 2
      list.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(frame)
  }, [session, activeIndex])

  useEffect(() => {
    if (restTimer && !restCountdown.active) {
      setRestTimer(null)
    }
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
  const phase = getPhaseInfo(workout)
  const doneCount = completedExerciseIds.length
  const allDone = doneCount === workout.exercises.length
  const isLastPhase = currentSet >= phase.total
  const phaseRestSeconds = getPhaseRestSeconds(workout)

  function handleCoachToggle() {
    const turningOn = !coachEnabled
    toggleCoach()
    if (turningOn && !allDone) {
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
    if (completedExerciseIds.includes(exerciseId)) return

    toggleComplete(exerciseId)

    if (coachEnabled) {
      const projected: typeof activeSession = {
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
        setCoachAnnouncement({
          text,
          key: `next-set-${nextSet}-${Date.now()}`,
        })
      }
    }
  }

  function handleFinish() {
    const summary = buildSessionSummary(activeSession)
    const hasNextWorkout = loadWorkoutQueue().length > 0
    saveLastSummary(summary, hasNextWorkout)
    publishToTvTransport(buildSummaryTvState(summary, theme), { theme })

    const result = completeSession(summary)
    navigate('/session/summary', {
      state: { summary, hasNextWorkout: result === 'next-workout' },
    })
  }

  function handleConnectTv() {
    if (!sessionTv) return
    void reconnectTv(sessionTv, { theme })
  }

  function handleDisconnectTv() {
    publishTvIdle(theme)
    disconnectTv()
  }

  return (
    <section className="flex h-[calc(100dvh-var(--header-h)-var(--bottomnav-h)-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem)] flex-col gap-3 pt-2">
      <header className="shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="label-mono text-success">● Live sessie</p>
            <h1 className="text-xl font-bold">{workout.name}</h1>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-1.5 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger active:bg-danger/20"
          >
            <Square className="size-3.5 fill-current" />
            Stop
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">
          {phase.label} {currentSet}/{phase.total} · {doneCount}/{workout.exercises.length} klaar ·
          Recovery {recoveryScore}%
        </p>
      </header>

      <div className="shrink-0">
        <SessionControlBar
          cameraEnabled={sensorEnabled}
          onCameraChange={setSensorEnabled}
          coachEnabled={coachEnabled}
          onCoachToggle={handleCoachToggle}
          tvStatus={tvStatus}
          onConnectTv={handleConnectTv}
          onDisconnectTv={handleDisconnectTv}
        />
      </div>

      <RestTimerBar countdown={restCountdown} onSkip={() => setRestTimer(null)} className="shrink-0" />

      {queue.length > 0 && (
        <div className="shrink-0 rounded-card border border-solo-400/30 bg-solo-400/5 p-3">
          <p className="label-mono text-[10px] text-faint">Wachtrij</p>
          <p className="text-sm text-muted">{queue.map((q) => q.workout.name).join(' → ')}</p>
        </div>
      )}

      {allDone && !isLastPhase && (
        <div className="flex shrink-0 items-stretch gap-2">
          {phaseRestSeconds > 0 && (
            <button
              type="button"
              onClick={handleStartPhaseRest}
              disabled={restCountdown.active}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-3 text-base font-bold transition-colors',
                restCountdown.active
                  ? 'bg-calm/20 text-calm'
                  : 'bg-calm text-ink active:opacity-90',
              )}
            >
              <span className="flex items-center gap-2">
                <TimerReset className="size-5" strokeWidth={2.5} />
                {restCountdown.active ? 'Rust loopt' : 'Rust'}
              </span>
              <span
                className={cn(
                  'font-mono text-xs font-semibold',
                  restCountdown.active ? 'text-calm/80' : 'text-ink/80',
                )}
              >
                {formatRestSeconds(phaseRestSeconds)}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={handleNextSet}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border border-solo-400/40 bg-solo-400/10 py-3 text-base font-bold text-solo-300 active:bg-solo-400/20"
          >
            <span className="flex items-center gap-2">
              Volgende
              <ChevronRight className="size-5" />
            </span>
            <span className="text-xs font-medium text-solo-300/80">
              {phase.label} {currentSet + 1}/{phase.total}
            </span>
          </button>
        </div>
      )}

      {allDone && isLastPhase && (
        <button
          type="button"
          onClick={handleFinish}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-success py-3.5 text-sm font-bold text-ink active:opacity-90"
        >
          <Check className="size-5" />
          Workout afronden
        </button>
      )}

      <ol ref={listRef} className="-mx-1 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-1 pb-2">
        {workout.exercises.map((ex, i) => {
          const weight = getExerciseWeight(ex, targets)
          const done = completedExerciseIds.includes(ex.id)
          const note = activeSession.exerciseNotes[ex.id]
          const isCurrent = i === activeIndex && !allDone
          const target = targets.find((t) => t.exerciseId === ex.id)

          return (
            <li
              key={ex.id}
              ref={isCurrent ? activeRowRef : undefined}
              className={cn(
                'relative rounded-card border bg-surface p-4 transition-all',
                done && !isCurrent && 'border-success/30 opacity-60',
                !done && !isCurrent && 'border-line',
                isCurrent &&
                  'border-solo-400 bg-solo-400/[0.07] shadow-lg shadow-solo-400/10 ring-2 ring-solo-400/50',
              )}
            >
              {isCurrent && (
                <span className="absolute -left-px top-4 h-[calc(100%-2rem)] w-1 rounded-full bg-solo-400" />
              )}
              <SessionExerciseRow
                ex={ex}
                index={i}
                weight={weight}
                done={done}
                isCurrent={isCurrent}
                reason={target?.reason}
                plateConfig={target?.plateConfig}
                note={note}
                exerciseStartedAt={activeSession.currentExerciseStartedAt ?? activeSession.startedAt}
                restSeconds={ex.restSeconds}
                restActive={restCountdown.active}
                onStartRest={handleStartRest}
                onMarkDone={() => handleMarkDone(ex.id)}
                onUndo={() => handleUndo(ex.id)}
                onNoteChange={(n) => setNote(ex.id, n)}
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
  reason?: string
  plateConfig?: import('@/types/workout').PlateConfig
  note?: { audioNote?: string; audioNoteText?: string }
  exerciseStartedAt: string
  restSeconds: number
  restActive: boolean
  onStartRest: () => void
  onMarkDone: () => void
  onUndo: () => void
  onNoteChange: (note: { audioNote?: string; audioNoteText?: string }) => void
}

function SessionExerciseRow({
  ex,
  index,
  weight,
  done,
  isCurrent,
  reason,
  plateConfig,
  note,
  exerciseStartedAt,
  restSeconds,
  restActive,
  onStartRest,
  onMarkDone,
  onUndo,
  onNoteChange,
}: SessionExerciseRowProps) {
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [showWeight, setShowWeight] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const exerciseTimer = useElapsedTimer(
    new Date(exerciseStartedAt).getTime(),
    isCurrent && !done,
  )

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
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'grid size-11 shrink-0 place-items-center rounded-lg transition-colors',
            done ? 'bg-success/15 text-success' : isCurrent ? 'bg-solo-400/20 text-solo-300' : 'bg-surface-2',
          )}
        >
          {done ? (
            <Check className="size-5" strokeWidth={3} />
          ) : (
            <ExerciseIcon metric={ex.metric} kind={ex.kind} equipment={ex.equipment} icon={ex.icon} size={24} />
          )}
        </span>

        <div className="min-w-0 flex-1">
          {isCurrent && !done && (
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-solo-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
              <span className="size-1.5 animate-pulse rounded-full bg-ink" />
              Nu bezig
            </span>
          )}
          <div className="flex items-center justify-between gap-2">
            <p
              className={cn(
                'min-w-0 font-semibold',
                done && 'text-success',
                isCurrent && !done && 'text-base text-fg',
              )}
            >
              {ex.name}
            </p>
            <div className="flex shrink-0 items-center gap-2">
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
              {isCurrent && !done && (
                <span
                  className="font-mono text-sm font-bold tabular-nums text-solo-400"
                  aria-live="polite"
                  aria-label={`Oefeningtijd ${exerciseTimer.formatted}`}
                >
                  {exerciseTimer.formatted}
                </span>
              )}
              <span
                className={cn(
                  'label-mono',
                  isCurrent && !done ? 'font-bold text-solo-400' : 'text-faint',
                )}
              >
                #{index + 1}
              </span>
            </div>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {formatExerciseTargetLine(ex, weight)}
          </p>
          {reason && <p className="mt-1 text-xs text-warn">{reason}</p>}
        </div>
      </div>

      {(isCurrent || note?.audioNote || note?.audioNoteText || plateConfig) && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[10px] text-muted active:bg-surface-2"
          >
            <Mic className="size-3" />
            {note?.audioNote || note?.audioNoteText ? 'Notitie ✓' : 'Audio'}
          </button>
          {plateConfig && weight > 0 && (
            <button
              type="button"
              onClick={() => setShowWeight((v) => !v)}
              className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[10px] text-solo-400 active:bg-surface-2"
            >
              <Scale className="size-3" />
              Gewichten
            </button>
          )}
        </div>
      )}

      {note?.audioNote && <audio src={note.audioNote} controls className="h-8 w-full" />}
      {note?.audioNoteText && (
        <p className="text-xs italic text-muted">"{note.audioNoteText}"</p>
      )}
      {showWeight && plateConfig && (
        <WeightAssistant exerciseName={ex.name} config={plateConfig} />
      )}

      {isCurrent && !done && (
        <div className="flex items-stretch gap-2">
          {restSeconds > 0 && (
            <button
              type="button"
              onClick={onStartRest}
              disabled={restActive}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-3 text-base font-bold transition-colors',
                restActive
                  ? 'bg-calm/20 text-calm'
                  : 'bg-calm text-ink active:opacity-90',
              )}
            >
              <span className="flex items-center gap-2">
                <TimerReset className="size-5" strokeWidth={2.5} />
                {restActive ? 'Rust loopt' : 'Rust'}
              </span>
              <span
                className={cn(
                  'font-mono text-xs font-semibold',
                  restActive ? 'text-calm/80' : 'text-ink/80',
                )}
              >
                {formatRestSeconds(restSeconds)}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={onMarkDone}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl bg-success py-3 text-base font-bold text-ink active:opacity-90"
          >
            <span className="flex items-center gap-2">
              <Check className="size-5" strokeWidth={3} />
              Klaar
            </span>
            <span className="text-xs font-medium text-ink/70">Oefening af</span>
          </button>
        </div>
      )}

      {done && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2.5">
          <span className="flex items-center gap-2 text-sm font-semibold text-success">
            <Check className="size-4" strokeWidth={3} />
            Afgevinkt
          </span>
          <button
            type="button"
            onClick={onUndo}
            className="text-xs font-medium text-muted underline-offset-2 active:text-fg"
          >
            Ongedaan maken
          </button>
        </div>
      )}

      {showInfo && ex.description && (
        <ExerciseInfoModal
          name={ex.name}
          description={ex.description}
          onClose={() => setShowInfo(false)}
        />
      )}
    </div>
  )
}
