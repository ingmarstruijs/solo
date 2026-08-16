import { useTranslation } from '@/i18n/hooks'
import { cn } from '@/lib/cn'

export function TvCameraPanel({ enabled }: { enabled: boolean }) {
  const { t } = useTranslation('tv')

  return (
    <div
      className={cn(
        'relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden rounded-[1.5vh] border',
        enabled ? 'border-success/40 bg-surface-2' : 'border-line bg-surface',
      )}
    >
      {enabled ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-solo-400/10 via-transparent to-calm/10 tv-anim-scan" />
          <div className="relative z-10 flex flex-col items-center gap-[1vh]">
            <span className="size-[2vh] animate-pulse rounded-full bg-success" />
            <p className="label-mono text-[1.2vh] text-success">{t('cameraLive')}</p>
            <p className="text-[1.4vh] text-muted">{t('cameraOnPhone')}</p>
          </div>
          <div className="absolute inset-4 rounded-lg border border-success/30" />
        </>
      ) : (
        <p className="text-[1.6vh] text-muted">{t('cameraOffPhone')}</p>
      )}
    </div>
  )
}
