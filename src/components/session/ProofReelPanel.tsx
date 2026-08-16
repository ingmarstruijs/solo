import { Film, Share2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from '@/i18n/hooks'
import {
  buildProofReel,
  getProofReelFacts,
  PROOF_REEL_SECONDS,
  shareProofReel,
} from '@/lib/proof/proofReel'
import type { SessionSummary } from '@/lib/workout/sessionSummary'
import { cn } from '@/lib/cn'

type ProofReelPanelProps = {
  summary: SessionSummary
  className?: string
  /** Auto-expand emphasis when opened from logbook proof CTA. */
  autoFocus?: boolean
}

type Phase = 'idle' | 'building' | 'ready' | 'error'

/**
 * Generate a ~15s on-device proof reel (FFmpeg Wasm) and share/download it.
 */
export function ProofReelPanel({ summary, className, autoFocus }: ProofReelPanelProps) {
  const { t } = useTranslation('session')
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shareNote, setShareNote] = useState<string | null>(null)
  const facts = getProofReelFacts(summary)

  async function handleBuild() {
    setPhase('building')
    setError(null)
    setShareNote(null)
    setProgress(0)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setBlob(null)

    try {
      const next = await buildProofReel(
        summary,
        {
          brand: 'SOLO.',
          titleHint: t('proofExercises'),
          durationLabel: t('summaryTotalTime'),
          paceLabel: t('summaryPace'),
          rpeLabel: t('summaryAvgRpe'),
          setsLabel: t('proofSets'),
          proofLabel: t('proofLabel'),
          peakRpeLabel: t('proofPeakRpe'),
          momentLabel: t('proofMoment'),
        },
        (p) => {
          setProgress(p.progress)
          if (p.text) setProgressText(p.text)
          else if (p.phase === 'slides') setProgressText(t('proofBuildingSlides'))
          else if (p.phase === 'ffmpeg') setProgressText(t('proofLoadingFfmpeg'))
          else setProgressText(t('proofEncoding'))
        },
      )
      const url = URL.createObjectURL(next)
      setBlob(next)
      setPreviewUrl(url)
      setPhase('ready')
      setProgress(1)
    } catch (err) {
      setPhase('error')
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleShare() {
    if (!blob) return
    setShareNote(null)
    try {
      const result = await shareProofReel(
        blob,
        `solo-proof-${summary.workoutName.replace(/\s+/g, '-').toLowerCase()}.mp4`,
        t('proofShareTitle', { workout: summary.workoutName }),
      )
      setShareNote(result === 'shared' ? t('proofShared') : t('proofDownloaded'))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <section
      id="proof-reel"
      className={cn(
        'scroll-mt-24 rounded-card border border-line bg-surface p-3',
        autoFocus && 'border-solo-400/50 ring-1 ring-solo-400/30',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Film className="size-4 text-solo-400" />
            {t('proofTitle')}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            {t('proofSubtitle', { seconds: PROOF_REEL_SECONDS })}
          </p>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted">{t('proofHint')}</p>
      {facts.momentCount > 0 ? (
        <p className="mt-1 text-[11px] text-solo-300">
          {t('proofMomentsReady', { count: facts.momentCount })}
        </p>
      ) : (
        <p className="mt-1 text-[11px] text-faint">{t('proofMomentsHint')}</p>
      )}

      <dl className="mt-3 grid grid-cols-2 gap-1.5 text-[11px] sm:grid-cols-4">
        <div className="rounded-lg border border-line bg-surface-2/70 px-2 py-1.5">
          <dt className="text-faint">{t('summaryTotalTime')}</dt>
          <dd className="mt-0.5 font-semibold tabular-nums">{facts.durationLabel}</dd>
        </div>
        <div className="rounded-lg border border-line bg-surface-2/70 px-2 py-1.5">
          <dt className="text-faint">{t('proofSets')}</dt>
          <dd className="mt-0.5 font-semibold tabular-nums">{facts.totalSets}</dd>
        </div>
        <div className="rounded-lg border border-line bg-surface-2/70 px-2 py-1.5">
          <dt className="text-faint">{t('summaryPace')}</dt>
          <dd className="mt-0.5 truncate font-semibold">{facts.paceLabel || '—'}</dd>
        </div>
        <div className="rounded-lg border border-line bg-surface-2/70 px-2 py-1.5">
          <dt className="text-faint">{t('summaryAvgRpe')}</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-warn">
            {facts.avgRpe != null ? facts.avgRpe : '—'}
            {facts.peakRpe != null && facts.avgRpe != null && facts.peakRpe !== facts.avgRpe
              ? ` · ${t('proofPeakRpe')} ${facts.peakRpe}`
              : ''}
          </dd>
        </div>
      </dl>

      {facts.exerciseNames.length > 0 && (
        <p className="mt-2 truncate text-[11px] text-muted">
          {t('proofExercises')}: {facts.exerciseNames.join(' · ')}
        </p>
      )}

      {previewUrl && (
        <video
          src={previewUrl}
          controls
          playsInline
          className="mt-3 aspect-[9/16] max-h-80 w-full rounded-xl border border-line bg-ink object-contain"
        />
      )}

      {phase === 'building' && (
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

      {error && <p className="mt-2 text-[11px] text-warn">{error}</p>}
      {shareNote && <p className="mt-2 text-[11px] text-success">{shareNote}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => void handleBuild()}
          disabled={phase === 'building'}
          className={cn(
            'min-h-11 flex-1 rounded-xl px-4 text-sm font-semibold',
            phase === 'building'
              ? 'cursor-wait border border-line bg-surface-2 text-faint'
              : 'bg-solo-400 text-ink active:bg-solo-500',
          )}
        >
          {phase === 'building'
            ? t('proofGenerating')
            : blob
              ? t('proofRegenerate')
              : t('proofGenerate')}
        </button>
        {blob && (
          <button
            type="button"
            onClick={() => void handleShare()}
            className="min-h-11 shrink-0 rounded-xl border border-line px-4 text-sm font-semibold text-solo-300 active:bg-surface-2"
          >
            <span className="inline-flex items-center gap-1.5">
              <Share2 className="size-4" />
              {t('proofShare')}
            </span>
          </button>
        )}
      </div>
    </section>
  )
}
