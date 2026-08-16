import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, Cpu, Play, RotateCcw } from 'lucide-react'
import { LabActionButton, LabInfoCard, LabLogPanel, LabStatusPanel, LabTelemetryCard } from '@/components/lab/LabPrimitives'
import { LabShell } from '@/components/lab/LabShell'
import { useLabLog } from '@/components/lab/useLabLog'
import { usePoseLandmarker } from '@/hooks/usePoseLandmarker'
import { loadPoseEngine } from '@/lib/pose/poseEngine'

export function PoseLabPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null)
  const [engineReady, setEngineReady] = useState(false)
  const [engineError, setEngineError] = useState<string | null>(null)
  const { logs, appendLog } = useLabLog()

  const webGpuAvailable = typeof navigator !== 'undefined' && 'gpu' in navigator
  const mediaDevicesAvailable = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)

  const pose = usePoseLandmarker({
    video: videoEl,
    canvas: canvasEl,
    enabled: cameraActive && engineReady,
  })

  useEffect(() => {
    void loadPoseEngine().then((engine) => {
      if (engine.status === 'ready') {
        setEngineReady(true)
        appendLog('success', 'Pose Landmarker ready (lite model).')
      } else {
        setEngineError(engine.error)
        appendLog('error', engine.error ?? 'Pose engine unavailable.')
      }
    })
  }, [appendLog])

  useEffect(() => {
    return () => stopCamera()
  }, [])

  async function startCamera() {
    if (!mediaDevicesAvailable) {
      appendLog('error', 'Camera API is not available in this browser.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setVideoEl(videoRef.current)
      }
      setCanvasEl(canvasRef.current)
      setCameraActive(true)
      appendLog('success', 'Front camera stream active.')
    } catch (err) {
      appendLog('error', err instanceof Error ? err.message : String(err))
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraActive(false)
    setVideoEl(null)
  }

  function resetCounters() {
    appendLog('info', 'Lab counters reset.')
  }

  return (
    <LabShell
      pillar="Pillar 3 · Visual Support"
      title="Camera & Pose"
      description="Front-camera access plus MediaPipe Pose Landmarker with advisory form cues (same stack as session preview)."
      icon={Camera}
    >
      <LabStatusPanel
        title={mediaDevicesAvailable ? 'Camera pipeline available' : 'Camera pipeline unavailable'}
        ok={mediaDevicesAvailable}
        checks={[
          { label: 'getUserMedia', ok: mediaDevicesAvailable, hint: mediaDevicesAvailable ? 'OK' : 'Unsupported' },
          { label: 'WebGPU hint', ok: webGpuAvailable, hint: webGpuAvailable ? 'Available' : 'Wasm fallback' },
          {
            label: 'Pose Landmarker',
            ok: engineReady,
            hint: engineReady ? 'Ready' : engineError ? 'Failed' : 'Loading…',
          },
        ]}
      />

      <div className="grid grid-cols-2 gap-3">
        <LabTelemetryCard icon={Camera} label="Camera" value={cameraActive ? 'ON' : 'OFF'} unit="stream" live={cameraActive} />
        <LabTelemetryCard
          icon={Cpu}
          label="Pose"
          value={pose.status === 'ready' ? (pose.hasPose ? 'TRACK' : 'SCAN') : pose.status.toUpperCase()}
          unit="state"
          live={pose.status === 'ready'}
          warn={pose.cues.length > 0}
        />
      </div>

      <div className="relative aspect-video overflow-hidden rounded-card border border-line bg-surface">
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
        {!cameraActive && (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted">
            Camera preview appears here.
          </div>
        )}
        {pose.cues[0] && (
          <div className="absolute inset-x-0 bottom-0 bg-ink/80 px-3 py-2 text-sm text-warn">
            Cue: {pose.cues[0].id.replace('_', ' ')}
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

      <LabInfoCard title="Pose product path">
        <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-muted">
          <li>Session camera preview uses the same engine with a form-cues toggle.</li>
          <li>Cues are advisory guidance only (knee valgus / forward collapse heuristics).</li>
          <li>If the model or Wasm fails to load, the camera preview still works without cues.</li>
        </ul>
      </LabInfoCard>

      <LabLogPanel logs={logs} emptyMessage="Start the camera to see runtime events." />
    </LabShell>
  )
}
