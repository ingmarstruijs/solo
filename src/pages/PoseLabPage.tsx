import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, Cpu, Play, RotateCcw } from 'lucide-react'
import { LabActionButton, LabInfoCard, LabLogPanel, LabStatusPanel, LabTelemetryCard } from '@/components/lab/LabPrimitives'
import { LabShell } from '@/components/lab/LabShell'
import { useLabLog } from '@/components/lab/useLabLog'

export function PoseLabPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [frames, setFrames] = useState(0)
  const [fps, setFps] = useState(0)
  const { logs, appendLog } = useLabLog()

  const webGpuAvailable = typeof navigator !== 'undefined' && 'gpu' in navigator
  const mediaDevicesAvailable = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)

  useEffect(() => {
    if (!cameraActive) return

    let animationFrame = 0
    let frameCount = 0
    let lastSample = performance.now()

    const tick = () => {
      frameCount += 1
      setFrames((current) => current + 1)
      const now = performance.now()
      if (now - lastSample >= 1000) {
        setFps(frameCount)
        frameCount = 0
        lastSample = now
      }
      animationFrame = requestAnimationFrame(tick)
    }

    animationFrame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationFrame)
  }, [cameraActive])

  useEffect(() => {
    return () => stopCamera()
  }, [])

  async function startCamera() {
    if (!mediaDevicesAvailable) {
      appendLog('error', 'Camera API is niet beschikbaar in deze browser.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraActive(true)
      appendLog('success', 'Front-camera stream actief.')
    } catch (err) {
      appendLog('error', err instanceof Error ? err.message : String(err))
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraActive(false)
    setFps(0)
  }

  function resetCounters() {
    setFrames(0)
    setFps(0)
    appendLog('info', 'Frame counters gereset.')
  }

  return (
    <LabShell
      pillar="Pillar 3 · Visual Support"
      title="Camera & Pose"
      description="Valideer front-camera toegang en runtime readiness voor een latere MediaPipe Pose Landmarker worker."
      icon={Camera}
    >
      <LabStatusPanel
        title={mediaDevicesAvailable ? 'Camera pipeline beschikbaar' : 'Camera pipeline niet beschikbaar'}
        ok={mediaDevicesAvailable}
        checks={[
          { label: 'getUserMedia', ok: mediaDevicesAvailable, hint: mediaDevicesAvailable ? 'OK' : 'Niet ondersteund' },
          { label: 'WebGPU hint', ok: webGpuAvailable, hint: webGpuAvailable ? 'Beschikbaar' : 'Fallback nodig' },
        ]}
      />

      <div className="grid grid-cols-2 gap-3">
        <LabTelemetryCard icon={Camera} label="Camera" value={cameraActive ? 'ON' : 'OFF'} unit="stream" live={cameraActive} />
        <LabTelemetryCard icon={Cpu} label="Frame loop" value={`${fps}`} unit="fps" live={cameraActive} warn={cameraActive && fps < 24} />
      </div>

      <div className="aspect-video overflow-hidden rounded-card border border-line bg-surface">
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        {!cameraActive && (
          <div className="-mt-[56.25%] grid aspect-video place-items-center text-sm text-muted">
            Camera-preview verschijnt hier.
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {cameraActive ? (
          <LabActionButton onClick={stopCamera} variant="danger">
            <CameraOff className="size-4" />
            Stop camera
          </LabActionButton>
        ) : (
          <LabActionButton onClick={() => void startCamera()} disabled={!mediaDevicesAvailable}>
            <Play className="size-4" />
            Start camera
          </LabActionButton>
        )}
        <LabActionButton onClick={resetCounters} variant="secondary">
          <RotateCcw className="size-4" />
          Reset
        </LabActionButton>
      </div>

      <LabInfoCard title="Pose-feasibility">
        <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-muted">
          <li>Deze test valideert camera-permissies en frame budget, nog niet de MediaPipe dependency.</li>
          <li>Onder 24 FPS is de latere skeleton-overlay waarschijnlijk te zwaar voor live TV-compositie.</li>
          <li>WebGPU is een hint voor lokale AI-capaciteit; MediaPipe kan ook via Wasm/GPU delegates draaien.</li>
        </ul>
      </LabInfoCard>

      <LabLogPanel logs={logs} emptyMessage="Start de camera om runtime events te zien." />
      <p className="label-mono text-faint">{frames} frames verwerkt in deze test.</p>
    </LabShell>
  )
}
