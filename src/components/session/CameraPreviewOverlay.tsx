import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '@/i18n/hooks'
import { useFormCuesEnabled } from '@/hooks/useFormCuesEnabled'
import { usePoseLandmarker } from '@/hooks/usePoseLandmarker'
import { cn } from '@/lib/cn'

type CameraPreviewOverlayProps = {
  stream: MediaStream | null
  onClose: () => void
  onDisable: () => void
}

export function CameraPreviewOverlay({ stream, onClose, onDisable }: CameraPreviewOverlayProps) {
  const { t } = useTranslation(['session', 'common'])
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null)
  const { enabled: formCuesEnabled, setEnabled: setFormCuesEnabled } = useFormCuesEnabled()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.srcObject = stream
    setVideoEl(video)
    return () => {
      video.srcObject = null
    }
  }, [stream])

  useEffect(() => {
    setCanvasEl(canvasRef.current)
  }, [])

  const pose = usePoseLandmarker({
    video: videoEl,
    canvas: canvasEl,
    enabled: formCuesEnabled && Boolean(stream),
  })

  const primaryCue = pose.cues[0]
  const statusLabel =
    !formCuesEnabled
      ? t('session:formCuesOff')
      : pose.status === 'loading'
        ? t('session:formCuesLoading')
        : pose.status === 'unavailable'
          ? t('session:formCuesUnavailable')
          : pose.status === 'ready'
            ? pose.hasPose
              ? t('session:formCuesTracking')
              : t('session:formCuesSearching')
            : t('session:formCuesOff')

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink">
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <p className="label-mono text-success">{t('session:cameraLive')}</p>
          <p className="truncate text-sm text-muted">{t('session:cameraPreviewHint')}</p>
          <p className="mt-0.5 truncate text-[11px] text-faint">{statusLabel}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('session:closePreview')}
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-surface text-fg active:bg-surface-2"
        >
          <X className="size-5" />
        </button>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 size-full scale-x-[-1] object-contain"
        />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 size-full scale-x-[-1] object-contain"
          aria-hidden
        />
        {!stream && (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted">
            {t('session:cameraStarting')}
          </div>
        )}

        {primaryCue && (
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/55 to-transparent px-4 pb-5 pt-10"
            role="status"
            aria-live="polite"
          >
            <p className="label-mono text-[10px] uppercase tracking-wider text-warn">
              {t('session:formCueLabel')}
            </p>
            <p className="mt-1 text-base font-semibold text-fg">{t(`session:${primaryCue.messageKey}`)}</p>
            <p className="mt-1 text-xs text-muted">{t('session:formCueAdvisory')}</p>
          </div>
        )}
      </div>

      <div
        className={cn(
          'flex shrink-0 flex-col gap-2 px-4 pt-3',
          'pb-[max(1rem,env(safe-area-inset-bottom))]',
        )}
      >
        <button
          type="button"
          onClick={() => setFormCuesEnabled(!formCuesEnabled)}
          aria-pressed={formCuesEnabled}
          className={cn(
            'w-full rounded-xl border py-2.5 text-sm font-semibold active:bg-surface-2',
            formCuesEnabled
              ? 'border-solo-400/40 bg-solo-400/10 text-solo-300'
              : 'border-line text-muted',
          )}
        >
          {formCuesEnabled ? t('session:formCuesOn') : t('session:formCuesOff')}
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-line py-3 text-sm font-semibold text-fg active:bg-surface-2"
          >
            {t('common:close')}
          </button>
          <button
            type="button"
            onClick={onDisable}
            className="flex-1 rounded-xl bg-danger/15 py-3 text-sm font-semibold text-danger active:bg-danger/25"
          >
            {t('session:cameraOff')}
          </button>
        </div>
      </div>
    </div>
  )
}
