import { Camera, Mic, Tv } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { TvConnectionStatus } from '@/lib/tv/transport'
import { CameraPreviewOverlay } from '@/components/session/CameraPreviewOverlay'
import { cn } from '@/lib/cn'

type SessionControlBarProps = {
  cameraEnabled: boolean
  onCameraChange: (enabled: boolean) => void
  coachEnabled: boolean
  onCoachToggle: () => void
  tvStatus?: TvConnectionStatus
  onConnectTv?: () => void
  onDisconnectTv?: () => void
}

/** Compact controls: camera, coach and TV status always fit one row. */
export function SessionControlBar({
  cameraEnabled,
  onCameraChange,
  coachEnabled,
  onCoachToggle,
  tvStatus = 'disconnected',
  onConnectTv,
  onDisconnectTv,
}: SessionControlBarProps) {
  const streamRef = useRef<MediaStream | null>(null)
  const [live, setLive] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  const tvConnected = tvStatus === 'connected'
  const tvConnecting = tvStatus === 'connecting'
  const showPhonePreview = cameraEnabled && live && !tvConnected

  useEffect(() => {
    if (!cameraEnabled) {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setLive(false)
      setPreviewOpen(false)
      return
    }

    let cancelled = false
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        setLive(true)
      })
      .catch(() => {
        if (!cancelled) onCameraChange(false)
      })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [cameraEnabled, onCameraChange])

  useEffect(() => {
    if (tvConnected) setPreviewOpen(false)
  }, [tvConnected])

  function handleCameraClick() {
    if (!cameraEnabled) {
      onCameraChange(true)
      return
    }
    if (tvConnected) {
      onCameraChange(false)
      return
    }
    if (live) setPreviewOpen(true)
  }

  function handleDisableCamera() {
    setPreviewOpen(false)
    onCameraChange(false)
  }

  return (
    <>
      <section className="flex flex-col gap-1.5 rounded-card border border-line bg-surface p-1.5">
        <div className="flex items-stretch gap-1.5">
          <IconToggle
            label={cameraEnabled ? (live ? 'Cam ●' : 'Cam…') : 'Camera'}
            active={cameraEnabled}
            activeClass="border-success/40 bg-success/10 text-success"
            onClick={handleCameraClick}
          >
            <Camera className="size-4" />
          </IconToggle>

          <IconToggle
            label="Coach"
            active={coachEnabled}
            activeClass="border-success/40 bg-success/10 text-success"
            onClick={onCoachToggle}
          >
            <Mic className="size-4" />
          </IconToggle>

          <IconToggle
            label={tvConnected ? 'TV ●' : tvConnecting ? 'TV…' : 'TV'}
            active={tvConnected}
            activeClass="border-success/40 bg-success/10 text-success"
            onClick={tvConnected ? onDisconnectTv : onConnectTv}
          >
            <Tv className="size-4" />
          </IconToggle>
        </div>
      </section>

      {previewOpen && showPhonePreview && (
        <CameraPreviewOverlay
          stream={streamRef.current}
          onClose={() => setPreviewOpen(false)}
          onDisable={handleDisableCamera}
        />
      )}
    </>
  )
}

function IconToggle({
  label,
  active,
  activeClass,
  onClick,
  children,
}: {
  label: string
  active: boolean
  activeClass: string
  onClick?: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg border px-1 py-1.5 text-[10px] font-medium leading-none transition-colors',
        active
          ? activeClass
          : 'border-line bg-surface-2 text-muted active:bg-surface-3',
        !onClick && 'cursor-default',
      )}
    >
      {children}
      <span className="mt-0.5 truncate">{label}</span>
    </button>
  )
}
