import { useEffect, useRef, useState } from 'react'
import { Activity, Heart, Layers, Play, RotateCcw, Zap } from 'lucide-react'
import { LabActionButton, LabInfoCard, LabTelemetryCard } from '@/components/lab/LabPrimitives'
import { LabShell } from '@/components/lab/LabShell'

export function CanvasCompositeLabPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [running, setRunning] = useState(false)
  const [heartRate, setHeartRate] = useState(136)
  const [reps, setReps] = useState(8)
  const [velocityLoss, setVelocityLoss] = useState(22)
  const [formCue, setFormCue] = useState(false)
  const [fps, setFps] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context || !running) return

    let animationFrame = 0
    let frameCount = 0
    let lastSample = performance.now()
    const startedAt = performance.now()

    const draw = () => {
      const now = performance.now()
      const elapsed = (now - startedAt) / 1000
      frameCount += 1

      context.fillStyle = '#0b0e11'
      context.fillRect(0, 0, canvas.width, canvas.height)

      const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#14181d')
      gradient.addColorStop(1, '#252c35')
      context.fillStyle = gradient
      context.fillRect(40, 40, canvas.width - 80, canvas.height - 80)

      drawStudioLoop(context, elapsed, canvas.width, canvas.height)
      drawSkeleton(context, canvas.width / 2, canvas.height / 2 + 20, formCue)
      drawHud(context, heartRate, reps, velocityLoss)

      if (formCue) {
        context.fillStyle = 'rgba(255, 107, 107, 0.16)'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.fillStyle = '#ff6b6b'
        context.font = '700 34px system-ui'
        context.fillText('KNEE VALGUS · DRIVE OUT', 48, canvas.height - 56)
      }

      if (now - lastSample >= 1000) {
        setFps(frameCount)
        frameCount = 0
        lastSample = now
      }

      animationFrame = requestAnimationFrame(draw)
    }

    animationFrame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animationFrame)
  }, [formCue, heartRate, reps, running, velocityLoss])

  function simulateRep() {
    setReps((current) => current + 1)
    setHeartRate((current) => Math.min(current + 2, 188))
    setVelocityLoss((current) => Math.min(current + 5, 65))
  }

  function reset() {
    setHeartRate(136)
    setReps(8)
    setVelocityLoss(22)
    setFormCue(false)
    setFps(0)
  }

  return (
    <LabShell
      pillar="Pillar 3 · Canvas Engine"
      title="Canvas Compositor"
      description="Render een 16:9 frame waarin studio-loop, skeleton cue en Garmin-telemetrie samenkomen."
      icon={Layers}
    >
      <div className="grid grid-cols-3 gap-3">
        <LabTelemetryCard icon={Heart} label="HR" value={`${heartRate}`} unit="bpm" live={running} />
        <LabTelemetryCard icon={Activity} label="Reps" value={`${reps}`} unit="count" live={running} />
        <LabTelemetryCard icon={Zap} label="Canvas" value={`${fps}`} unit="fps" live={running} warn={running && fps < 30} />
      </div>

      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="aspect-video w-full rounded-card border border-line bg-ink"
      />

      <div className="flex gap-2">
        <LabActionButton onClick={() => setRunning((current) => !current)}>
          <Play className="size-4" />
          {running ? 'Pauzeer render' : 'Start render'}
        </LabActionButton>
        <LabActionButton onClick={simulateRep} variant="secondary">
          <Activity className="size-4" />
          Rep
        </LabActionButton>
      </div>

      <div className="flex gap-2">
        <LabActionButton onClick={() => setFormCue((current) => !current)} variant={formCue ? 'danger' : 'secondary'}>
          <Zap className="size-4" />
          Form cue
        </LabActionButton>
        <LabActionButton onClick={reset} variant="secondary">
          <RotateCcw className="size-4" />
          Reset
        </LabActionButton>
      </div>

      <LabInfoCard title="Compositor-check">
        <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-muted">
          <li>Dit canvas is de bron voor het latere TV-frame via <code>canvas.captureStream(30)</code>.</li>
          <li>De Garmin HUD wordt in het frame gebrand, zodat TV-output geen extra app-state nodig heeft.</li>
          <li>Form cues moeten visueel duidelijk zijn zonder de studio-loop volledig te blokkeren.</li>
        </ul>
      </LabInfoCard>
    </LabShell>
  )
}

function drawStudioLoop(context: CanvasRenderingContext2D, elapsed: number, width: number, height: number) {
  const x = 160 + Math.sin(elapsed * 1.8) * 36
  const y = height / 2 + Math.cos(elapsed * 1.3) * 18

  context.strokeStyle = 'rgba(124, 179, 240, 0.24)'
  context.lineWidth = 4
  for (let i = 0; i < 7; i += 1) {
    context.beginPath()
    context.arc(x + i * 150, y, 58 + i * 5, 0, Math.PI * 2)
    context.stroke()
  }
}

function drawSkeleton(context: CanvasRenderingContext2D, x: number, y: number, warn: boolean) {
  context.strokeStyle = warn ? '#ff6b6b' : '#7cb3f0'
  context.fillStyle = warn ? '#ff6b6b' : '#7cb3f0'
  context.lineWidth = 7
  context.lineCap = 'round'

  context.beginPath()
  context.arc(x, y - 140, 32, 0, Math.PI * 2)
  context.fill()
  line(context, x, y - 100, x, y + 60)
  line(context, x, y - 40, x - 110, y + 20)
  line(context, x, y - 40, x + 110, y + 20)
  line(context, x, y + 60, x - 88, y + 190)
  line(context, x, y + 60, x + (warn ? 52 : 88), y + 190)
}

function drawHud(context: CanvasRenderingContext2D, heartRate: number, reps: number, velocityLoss: number) {
  context.fillStyle = 'rgba(11, 14, 17, 0.82)'
  context.fillRect(48, 48, 462, 118)
  context.fillStyle = '#5a6573'
  context.font = '700 18px monospace'
  context.fillText('GARMIN LIVE SYNC', 72, 86)
  context.fillStyle = '#e8edf2'
  context.font = '800 46px monospace'
  context.fillText(`${heartRate} BPM`, 72, 136)
  context.fillText(`${reps} REPS`, 290, 136)
  context.fillStyle = velocityLoss > 35 ? '#ff8a3d' : '#7cb3f0'
  context.fillText(`${velocityLoss}%`, 1040, 92)
}

function line(context: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) {
  context.beginPath()
  context.moveTo(fromX, fromY)
  context.lineTo(toX, toY)
  context.stroke()
}
