import { useEffect, useRef, useState } from 'react'
import { MonitorPlay, Play, Radio, RotateCcw, Square, Tv } from 'lucide-react'
import { LabActionButton, LabInfoCard, LabLogPanel, LabStatusPanel, LabTelemetryCard } from '@/components/lab/LabPrimitives'
import { LabShell } from '@/components/lab/LabShell'
import { useLabLog } from '@/components/lab/useLabLog'

type CaptureCanvas = HTMLCanvasElement & {
  captureStream?: (frameRate?: number) => MediaStream
}

export function CastStreamLabPage() {
  const canvasRef = useRef<CaptureCanvas | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [rendering, setRendering] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [frames, setFrames] = useState(0)
  const [fps, setFps] = useState(0)
  const { logs, appendLog } = useLabLog()

  const captureSupported = typeof HTMLCanvasElement !== 'undefined' && 'captureStream' in HTMLCanvasElement.prototype

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context || !rendering) return

    let animationFrame = 0
    let frameCount = 0
    let lastSample = performance.now()
    const startedAt = performance.now()

    const draw = () => {
      const now = performance.now()
      const t = (now - startedAt) / 1000
      frameCount += 1
      setFrames((current) => current + 1)

      context.fillStyle = '#0b0e11'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = '#14181d'
      context.fillRect(40, 40, canvas.width - 80, canvas.height - 80)
      context.fillStyle = '#7cb3f0'
      context.font = '800 64px system-ui'
      context.fillText('SOLO. TV STREAM', 72, 118)
      context.fillStyle = '#8a97a6'
      context.font = '500 28px system-ui'
      context.fillText('canvas.captureStream(30) feasibility', 76, 164)

      context.strokeStyle = '#7cb3f0'
      context.lineWidth = 10
      context.beginPath()
      context.arc(640, 360, 120 + Math.sin(t * 2) * 24, 0, Math.PI * 2)
      context.stroke()

      context.fillStyle = '#e8edf2'
      context.font = '800 96px monospace'
      context.fillText(`${Math.round(t).toString().padStart(2, '0')}s`, 540, 390)

      if (now - lastSample >= 1000) {
        setFps(frameCount)
        frameCount = 0
        lastSample = now
      }

      animationFrame = requestAnimationFrame(draw)
    }

    animationFrame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animationFrame)
  }, [rendering])

  useEffect(() => {
    return () => stopStream()
  }, [])

  function startStream() {
    const canvas = canvasRef.current
    if (!canvas?.captureStream) {
      appendLog('error', 'canvas.captureStream wordt niet ondersteund in deze browser.')
      return
    }

    if (!rendering) setRendering(true)
    const stream = canvas.captureStream(30)
    streamRef.current = stream
    if (videoRef.current) videoRef.current.srcObject = stream
    setStreaming(true)
    appendLog('success', 'MediaStream gestart vanuit canvas op 30 FPS.')
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setStreaming(false)
  }

  function reset() {
    stopStream()
    setRendering(false)
    setFrames(0)
    setFps(0)
    appendLog('info', 'Streamlab gereset.')
  }

  return (
    <LabShell
      pillar="Web-to-Cast"
      title="TV Cast Stream"
      description="Controleer of het gecomposeerde canvas als MediaStream kan worden aangeboden aan AirPlay/Chromecast-achtige output."
      icon={Tv}
    >
      <LabStatusPanel
        title={captureSupported ? 'MediaStream pipeline beschikbaar' : 'MediaStream pipeline niet beschikbaar'}
        ok={captureSupported}
        checks={[
          { label: 'canvas.captureStream', ok: captureSupported, hint: captureSupported ? 'OK' : 'Niet ondersteund' },
          { label: '30 FPS render budget', ok: fps >= 30 || !rendering, hint: rendering ? `${fps} fps` : 'Nog niet gemeten' },
        ]}
      />

      <div className="grid grid-cols-2 gap-3">
        <LabTelemetryCard icon={MonitorPlay} label="Render" value={rendering ? 'ON' : 'OFF'} unit="canvas" live={rendering} />
        <LabTelemetryCard icon={Radio} label="Output" value={streaming ? 'LIVE' : 'IDLE'} unit="MediaStream" live={streaming} />
      </div>

      <canvas ref={canvasRef} width={1280} height={720} className="aspect-video w-full rounded-card border border-line bg-ink" />

      <LabInfoCard title="Local stream preview">
        <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full rounded-xl border border-line bg-ink object-cover" />
      </LabInfoCard>

      <div className="flex gap-2">
        <LabActionButton onClick={() => setRendering((current) => !current)}>
          <Play className="size-4" />
          {rendering ? 'Pauzeer canvas' : 'Start canvas'}
        </LabActionButton>
        {streaming ? (
          <LabActionButton onClick={stopStream} variant="danger">
            <Square className="size-4" />
            Stop stream
          </LabActionButton>
        ) : (
          <LabActionButton onClick={startStream} variant="secondary" disabled={!captureSupported}>
            <Tv className="size-4" />
            Capture stream
          </LabActionButton>
        )}
      </div>

      <LabActionButton onClick={reset} variant="secondary">
        <RotateCcw className="size-4" />
        Reset
      </LabActionButton>

      <LabInfoCard title="Cast-feasibility">
        <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-muted">
          <li>Deze test levert een MediaStream; echte AirPlay/Chromecast-aansturing blijft browser- en device-afhankelijk.</li>
          <li>Als de preview vloeiend loopt, kan de Active Set HUD als één video-output worden behandeld.</li>
          <li>Het aantal getekende frames is {frames}; stabiel rond 30 FPS is de minimale target.</li>
        </ul>
      </LabInfoCard>

      <LabLogPanel logs={logs} emptyMessage="Start captureStream om output-events te zien." />
    </LabShell>
  )
}
