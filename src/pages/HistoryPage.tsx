import {
  BarChart3,
  ChevronRight,
  Clock,
  Dumbbell,
  Film,
  Flame,
  Sparkles,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { useNavigate } from 'react-router'
import { useHistory } from '@/hooks/useHistory'
import { getAppLocale } from '@/i18n'
import { useTranslation } from '@/i18n/hooks'
import { getProofReelFacts } from '@/lib/proof/proofReel'
import type { SessionRecord } from '@/lib/storage/historyStore'
import { formatDuration } from '@/lib/workout/sessionSummary'
import { cn } from '@/lib/cn'

function formatWhen(iso: string, locale: string, todayAt: (time: string) => string): string {
  const date = new Date(iso)
  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (sameDay) {
    return todayAt(
      date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
    )
  }

  return date.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SetSparkline({ values }: { values: number[] }) {
  const bars = values.filter((value) => value >= 0)
  if (bars.length === 0) return null
  const max = Math.max(...bars, 1)

  return (
    <div className="mt-2 flex h-8 items-end gap-1 rounded-md bg-surface-2/80 px-1.5 py-1" aria-hidden>
      {bars.map((value, index) => {
        const px = value > 0 ? Math.max(6, Math.round((value / max) * 24)) : 3
        return (
          <div
            key={index}
            className={cn('min-w-[8px] flex-1 rounded-sm', value > 0 ? 'bg-solo-400' : 'bg-line')}
            style={{ height: `${px}px` }}
            title={`${index + 1}: ${formatDuration(value)}`}
          />
        )
      })}
    </div>
  )
}

function SessionCard({
  record,
  locale,
  onOpen,
  onProof,
  onDelete,
}: {
  record: SessionRecord
  locale: string
  onOpen: () => void
  onProof: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation('history')
  const facts = getProofReelFacts(record.summary)
  const exercisePreview = facts.exerciseNames.slice(0, 3)
  const moreExercises = Math.max(0, facts.exerciseNames.length - exercisePreview.length)

  return (
    <article className="rounded-card border border-line bg-surface p-2">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="flex min-w-0 flex-1 items-start gap-3 p-1 text-left active:bg-surface-2"
        >
          <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-solo-400">
            <BarChart3 className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold">{record.workoutName}</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {formatWhen(record.completedAt, locale, (time) => t('todayAt', { time }))}
                </p>
              </div>
              <ChevronRight className="mt-1 size-5 shrink-0 text-faint" />
            </div>

            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <FactChip label={t('factDuration')} value={facts.durationLabel} />
              <FactChip
                label={t('factSets')}
                value={facts.totalSets > 0 ? String(facts.totalSets) : '—'}
              />
              <FactChip
                label={t('factRpe')}
                value={facts.avgRpe != null ? String(facts.avgRpe) : '—'}
                accent={facts.avgRpe != null}
              />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-faint">
              <span className="flex items-center gap-1">
                <Dumbbell className="size-3" />
                {t('exercises', { count: record.exerciseCount })}
              </span>
              {facts.paceLabel && (
                <span className="truncate text-muted">{facts.paceLabel}</span>
              )}
              {facts.peakRpe != null && facts.avgRpe != null && facts.peakRpe !== facts.avgRpe && (
                <span>{t('peakRpe', { value: facts.peakRpe })}</span>
              )}
            </div>

            {exercisePreview.length > 0 && (
              <p className="mt-1.5 truncate text-[11px] text-muted">
                {exercisePreview.join(' · ')}
                {moreExercises > 0 ? ` · +${moreExercises}` : ''}
              </p>
            )}

            <SetSparkline values={facts.setDurations} />

            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-md border border-solo-400/30 bg-solo-400/10 px-1.5 py-0.5 text-[10px] font-medium text-solo-300">
                {t('proofReady')}
              </span>
              {facts.momentCount > 0 && (
                <span className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                  {t('momentsBadge', { count: facts.momentCount })}
                </span>
              )}
              {facts.hasAiReport && (
                <span className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                  <Sparkles className="size-3" />
                  {t('aiReportBadge')}
                </span>
              )}
            </div>
          </div>
        </button>

        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={onProof}
            className="grid size-10 place-items-center rounded-lg border border-solo-400/40 bg-solo-400/10 text-solo-300 active:bg-solo-400/20"
            aria-label={t('proofAria', { name: record.workoutName })}
            title={t('createProof')}
          >
            <Film className="size-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="grid size-10 place-items-center rounded-lg text-faint active:bg-danger/10 active:text-danger"
            aria-label={t('deleteAria', { name: record.workoutName })}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </article>
  )
}

function FactChip({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="rounded-lg border border-line bg-surface-2/80 px-1.5 py-1.5 text-center">
      <p
        className={cn(
          'text-sm font-bold tabular-nums leading-none',
          accent ? 'text-warn' : 'text-fg',
        )}
      >
        {value}
      </p>
      <p className="mt-1 label-mono text-[8px] text-faint">{label}</p>
    </div>
  )
}

export function HistoryPage() {
  const { t, i18n } = useTranslation('history')
  const navigate = useNavigate()
  const { history, stats, remove, clearAll } = useHistory()
  const locale = i18n.language || getAppLocale()

  function handleClearAll() {
    if (!confirm(t('clearConfirm'))) return
    clearAll()
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(t('deleteConfirm', { name }))) return
    remove(id)
  }

  return (
    <div className="flex flex-col gap-3 py-1">
      <div className="sticky top-[calc(var(--header-h)+env(safe-area-inset-top))] z-20 -mx-4 border-b border-line bg-ink/95 px-4 pb-3 pt-1 backdrop-blur-sm">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-surface-2 text-solo-400">
              <BarChart3 className="size-5" />
            </span>
            <div>
              <h1 className="text-lg font-bold tracking-tight">{t('title')}</h1>
              <p className="text-[11px] text-muted">{t('subtitle')}</p>
            </div>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="shrink-0 rounded-lg border border-danger/40 px-2.5 py-1.5 text-xs font-medium text-danger active:bg-danger/10"
            >
              {t('clearAll')}
            </button>
          )}
        </header>

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          <StatPill icon={Flame} label={t('thisWeek')} value={String(stats.sessionsThisWeek)} />
          <StatPill icon={TrendingUp} label={t('sessions')} value={String(stats.totalSessions)} />
          <StatPill icon={Clock} label={t('minutes')} value={String(stats.totalMinutes)} />
          <StatPill
            icon={Dumbbell}
            label={stats.avgRpeThisWeek != null ? t('weekRpe') : t('weekSets')}
            value={
              stats.avgRpeThisWeek != null
                ? String(stats.avgRpeThisWeek)
                : String(stats.setsThisWeek)
            }
          />
        </div>

        {history.length > 0 && (
          <p className="mt-2 text-[11px] text-muted">{t('proofHint')}</p>
        )}
      </div>

      {history.length === 0 ? (
        <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
          {t('empty')}
        </p>
      ) : (
        <div className="flex flex-col gap-2 pb-20">
          {history.map((record) => (
            <SessionCard
              key={record.id}
              record={record}
              locale={locale}
              onOpen={() => navigate(`/history/${record.id}`)}
              onProof={() => navigate(`/history/${record.id}?focus=proof`)}
              onDelete={() => handleDelete(record.id, record.workoutName)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Flame
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-line bg-surface px-1.5 py-2 text-center">
      <Icon className="mx-auto mb-0.5 size-3.5 text-solo-400" />
      <p className="text-sm font-bold tabular-nums sm:text-base">{value}</p>
      <p className="label-mono text-[7px] text-faint sm:text-[8px]">{label}</p>
    </div>
  )
}
