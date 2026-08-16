import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from '@/i18n/hooks'
import { cn } from '@/lib/cn'

type CameraPreviewOverlayProps = {
  stream: MediaStream | null
  onClose: () => void
  onDisable: () => void
}

export function CameraPreviewOverlay({ stream, onClose, onDisable }: CameraPreviewOverlayProps) {
  const { t } = useTranslation(['session', 'common'])
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.srcObject = stream
    return () => {
      video.srcObject = null
    }
  }, [stream])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink">
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <div>
          <p className="label-mono text-success">{t('session:cameraLive')}</p>
          <p className="text-sm text-muted">{t('session:cameraPreviewHint')}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('session:closePreview')}
          className="grid size-10 place-items-center rounded-xl border border-line bg-surface text-fg active:bg-surface-2"
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
          className="size-full object-cover"
        />
        {!stream && (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted">
            {t('session:cameraStarting')}
          </div>
        )}
      </div>

      <div
        className={cn(
          'flex shrink-0 gap-2 px-4 pt-3',
          'pb-[max(1rem,env(safe-area-inset-bottom))]',
        )}
      >
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
  )
}
