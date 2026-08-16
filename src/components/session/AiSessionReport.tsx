import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from '@/i18n/hooks'
import {
  checkWebGpuSupport,
  generateSessionReport,
  SESSION_REPORT_MODEL_ID,
} from '@/lib/ai/sessionReport'
import type { SessionSummary } from '@/lib/workout/sessionSummary'
import { cn } from '@/lib/cn'

type AiSessionReportProps = {
  summary: SessionSummary
  locale: string
  onReport: (next: SessionSummary) => void
  className?: string
}

type Phase = 'idle' | 'loading' | 'ready' | 'unavailable' | 'error'

/**
 * On-device post-workout coaching report via WebLLM (Gemma 3 1B).
 * Degrades cleanly when WebGPU or model load fails.
 */
export function AiSessionReport({ summary, locale, onReport, className }: AiSessionReportProps) {
  const { t } = useTranslation('session')
  const support = checkWebGpuSupport()
  const [phase, setPhase] = useState<Phase>(
    summary.aiReport ? 'ready' : support.available ? 'idle' : 'unavailable',
  )
  const [progressText, setProgressText] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(support.available ? null : support.reason ?? null)

  async function handleGenerate() {
    if (!support.available) {
      setPhase('unavailable')
      setError(support.reason ?? t('aiUnavailable'))
      return
    }

    setPhase('loading')
    setError(null)
    setProgress(0)
    setProgressText(t('aiLoading'))

    try {
      const { text, modelId } = await generateSessionReport(summary, locale, (p) => {
        setProgress(p.progress)
        setProgressText(p.text || t('aiLoading'))
      })
      onReport({
        ...summary,
        aiReport: text,
        aiReportModel: modelId,
        aiReportAt: new Date().toISOString(),
      })
      setPhase('ready')
      setProgress(1)
    } catch (err) {
      setPhase(support.available ? 'error' : 'unavailable')
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <section className={cn('rounded-card border border-line bg-surface p-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="size-4 text-solo-400" />
            {t('aiTitle')}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">{t('aiSubtitle')}</p>
        </div>
        {summary.aiReport && (
          <span className="label-mono shrink-0 text-[9px] text-faint">
            {summary.aiReportModel ?? SESSION_REPORT_MODEL_ID}
          </span>
        )}
      </div>

      {summary.aiReport ? (
        <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-fg">
          {summary.aiReport}
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted">{t('aiHint')}</p>
      )}

      {phase === 'loading' && (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-solo-400 transition-[width] duration-300"
              style={{ width: `${Math.max(4, Math.round(progress * 100))}%` }}
            />
          </div>
          <p className="mt-1.5 truncate text-[10px] text-faint">{progressText}</p>
        </div>
      )}

      {error && phase !== 'loading' && (
        <p className="mt-2 text-[11px] text-warn">{error}</p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={phase === 'loading' || phase === 'unavailable'}
          className={cn(
            'min-h-11 flex-1 rounded-xl px-4 text-sm font-semibold',
            phase === 'unavailable'
              ? 'cursor-not-allowed border border-line bg-surface-2 text-faint'
              : 'bg-solo-400 text-ink active:bg-solo-500',
          )}
        >
          {phase === 'loading'
            ? t('aiGenerating')
            : summary.aiReport
              ? t('aiRegenerate')
              : t('aiGenerate')}
        </button>
      </div>
    </section>
  )
}
