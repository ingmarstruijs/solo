import { ChevronRight, Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { PageBackButton } from '@/components/layout/PageBackButton'
import { WorkoutSummary } from '@/components/session/WorkoutSummary'
import { useHistory } from '@/hooks/useHistory'
import { useSessionActions } from '@/hooks/useSessionActions'
import { useTheme } from '@/hooks/useTheme'
import { getAppLocale } from '@/i18n'
import { useTranslation } from '@/i18n/hooks'
import { getSessionRecord } from '@/lib/storage/historyStore'
import { buildSummaryTvState } from '@/lib/tv/broadcast'
import { publishToTvTransport, publishTvIdle } from '@/lib/tv/transport'
import { loadWorkoutQueue, popNextQueuedWorkout } from '@/lib/workout/sessionPrep'
import {
  clearLastSummary,
  formatDuration,
  loadLastSummary,
  normalizeSummary,
  type SessionSummary,
} from '@/lib/workout/sessionSummary'

type SummaryLocationState = {
  summary?: SessionSummary
  hasNextWorkout?: boolean
}

export function SessionSummaryPage() {
  const { t, i18n } = useTranslation(['session', 'common', 'history'])
  const navigate = useNavigate()
  const location = useLocation()
  const { sessionId } = useParams<{ sessionId?: string }>()
  const { theme } = useTheme()
  const { startNextWorkout } = useSessionActions()
  const { remove: removeHistory } = useHistory()
  const isHistoryView = Boolean(sessionId)
  const locale = i18n.language || getAppLocale()

  const state = location.state as SummaryLocationState | null
  const stored = loadLastSummary()
  const historyRecord = sessionId ? getSessionRecord(sessionId) : undefined
  const summary = isHistoryView
    ? historyRecord
      ? normalizeSummary(historyRecord.summary)
      : undefined
    : state?.summary
      ? normalizeSummary(state.summary)
      : stored?.summary
  const hasNextWorkout =
    !isHistoryView &&
    (state?.hasNextWorkout ?? stored?.hasNextWorkout ?? loadWorkoutQueue().length > 0)

  useEffect(() => {
    if (!summary || isHistoryView) return
    publishToTvTransport(buildSummaryTvState(summary, theme), { theme })
  }, [summary, theme, isHistoryView])

  function leaveSummary() {
    clearLastSummary()
    publishTvIdle(theme)
  }

  function handleDeleteHistory() {
    if (!sessionId || !historyRecord) return
    if (!confirm(t('history:deleteConfirm', { name: historyRecord.workoutName }))) return
    removeHistory(sessionId)
    navigate('/history')
  }

  function handleDone() {
    if (isHistoryView) {
      navigate('/history')
      return
    }
    leaveSummary()
    navigate('/workouts')
  }

  function handleNextWorkout() {
    const next = popNextQueuedWorkout()
    if (!next) {
      handleDone()
      return
    }
    clearLastSummary()
    startNextWorkout(next)
    navigate('/session')
  }

  if (!summary) {
    return (
      <section className="flex flex-col gap-4 py-2">
        <h1 className="text-xl font-bold">
          {isHistoryView ? t('session:sessionNotFound') : t('session:summaryMissing')}
        </h1>
        <p className="text-sm text-muted">
          {isHistoryView ? t('session:sessionNotFoundHint') : t('session:summaryMissingHint')}
        </p>
        <button
          type="button"
          onClick={() => navigate(isHistoryView ? '/history' : '/workouts')}
          className="rounded-xl bg-solo-400 py-3 text-sm font-semibold text-ink"
        >
          {isHistoryView ? t('session:backToLogbook') : t('session:goToWorkouts')}
        </button>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-3 py-1">
      <div className="flex items-center gap-2">
        <PageBackButton
          to={isHistoryView ? '/history' : '/workouts'}
          label={isHistoryView ? t('history:title') : undefined}
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold">{summary.workoutName}</h1>
          <p className="text-xs text-muted">
            {formatDuration(summary.totalDurationSeconds)}
            {isHistoryView && historyRecord && (
              <>
                {' · '}
                {new Date(historyRecord.completedAt).toLocaleDateString(locale, {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </>
            )}
          </p>
        </div>
        {isHistoryView && (
          <button
            type="button"
            onClick={handleDeleteHistory}
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-danger/40 bg-danger/10 text-danger active:bg-danger/20"
            aria-label={t('common:delete')}
          >
            <Trash2 className="size-5" />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        <WorkoutSummary summary={summary} showHeader={false} />
      </div>

      <div className="flex shrink-0 flex-col gap-2">
        {!isHistoryView && hasNextWorkout && (
          <button
            type="button"
            onClick={handleNextWorkout}
            className="flex items-center justify-center gap-2 rounded-xl bg-solo-400 py-3.5 text-sm font-bold text-ink active:bg-solo-500"
          >
            {t('session:nextWorkout')}
            <ChevronRight className="size-4" />
          </button>
        )}
        {!isHistoryView && (
          <button
            type="button"
            onClick={handleDone}
            className="rounded-xl border border-line py-3 text-sm font-semibold text-fg active:bg-surface-2"
          >
            {hasNextWorkout ? t('session:stop') : t('session:backToWorkouts')}
          </button>
        )}
      </div>
    </section>
  )
}
