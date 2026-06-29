import { useMemo, useState } from 'react'
import { Activity, Camera, Heart, Play, RotateCcw, Workflow, Zap } from 'lucide-react'
import { LabActionButton, LabInfoCard, LabTelemetryCard, PipelineStage } from '@/components/lab/LabPrimitives'
import { LabShell } from '@/components/lab/LabShell'
import { useLabLog } from '@/components/lab/useLabLog'
import { cn } from '@/lib/cn'

type FlowStep = 'watch' | 'ble' | 'browser' | 'pose' | 'canvas' | 'deviation' | 'stream'

const flowOrder: FlowStep[] = ['watch', 'ble', 'browser', 'pose', 'canvas', 'deviation', 'stream']

export function ActiveSetLabPage() {
  const [activeIndex, setActiveIndex] = useState(-1)
  const [heartRate, setHeartRate] = useState(128)
  const [reps, setReps] = useState(0)
  const [velocityLoss, setVelocityLoss] = useState(12)
  const [formDeviation, setFormDeviation] = useState(false)
  const { logs, appendLog, clearLogs } = useLabLog()

  const fatigueWarning = velocityLoss > 35 && heartRate > 145

  const stepStatuses = useMemo(() => {
    return flowOrder.reduce<Record<FlowStep, 'idle' | 'active' | 'ok' | 'warn'>>((acc, step, index) => {
      acc[step] =
        index < activeIndex
          ? 'ok'
          : index === activeIndex
            ? step === 'deviation' && formDeviation
              ? 'warn'
              : 'active'
            : 'idle'
      return acc
    }, {} as Record<FlowStep, 'idle' | 'active' | 'ok' | 'warn'>)
  }, [activeIndex, formDeviation])

  function advanceFlow() {
    const nextIndex = Math.min(activeIndex + 1, flowOrder.length - 1)
    setActiveIndex(nextIndex)

    const nextStep = flowOrder[nextIndex]
    if (nextStep === 'watch') appendLog('info', 'Set gestart op Garmin Watch.')
    if (nextStep === 'ble') appendLog('success', 'Connect IQ opent BLE-kanaal naar telefoon.')
    if (nextStep === 'browser') appendLog('success', 'Phone Browser ontvangt HR, reps en velocity loss.')
    if (nextStep === 'pose') appendLog('info', 'Pose worker draait naast de telemetrie-pipeline.')
    if (nextStep === 'canvas') appendLog('success', 'Canvas compositor brandt Garmin HUD in het 16:9 frame.')
    if (nextStep === 'deviation') appendLog(formDeviation ? 'warn' : 'info', formDeviation ? 'Knee valgus cue actief.' : 'Skeleton blijft pastel-blauw.')
    if (nextStep === 'stream') appendLog('success', 'MediaStream pipeline schiet het canvas richting TV.')
  }

  function addRep() {
    setReps((current) => current + 1)
    setHeartRate((current) => Math.min(current + 3, 185))
    setVelocityLoss((current) => Math.min(current + 6, 60))
    appendLog('info', `Rep ${reps + 1}: HR + velocity bijgewerkt.`)
  }

  function reset() {
    setActiveIndex(-1)
    setHeartRate(128)
    setReps(0)
    setVelocityLoss(12)
    setFormDeviation(false)
    clearLogs()
  }

  return (
    <LabShell
      pillar="Active Set · End-to-end"
      title="Active Set Loop"
      description="Simuleer de flow waarin Garmin, Web Bluetooth, front-camera, canvas en TV-stream tegelijk moeten samenwerken."
      icon={Workflow}
    >
      <div className="grid grid-cols-3 gap-3">
        <LabTelemetryCard icon={Heart} label="Hartslag" value={`${heartRate}`} unit="bpm" live={activeIndex >= 2} warn={fatigueWarning} />
        <LabTelemetryCard icon={Activity} label="Reps" value={`${reps}`} unit="count" live={activeIndex >= 2} />
        <LabTelemetryCard icon={Zap} label="Velocity loss" value={`${velocityLoss}`} unit="%" live={activeIndex >= 2} warn={velocityLoss > 35} />
      </div>

      <div className="flex gap-2">
        <LabActionButton onClick={advanceFlow} disabled={activeIndex === flowOrder.length - 1}>
          <Play className="size-4" />
          Volgende stap
        </LabActionButton>
        <LabActionButton onClick={addRep} variant="secondary" disabled={activeIndex < 2}>
          <Activity className="size-4" />
          Rep simuleren
        </LabActionButton>
      </div>

      <div className="flex gap-2">
        <LabActionButton
          onClick={() => {
            setFormDeviation((current) => !current)
            appendLog(!formDeviation ? 'warn' : 'info', !formDeviation ? 'AI form deviation ingeschakeld.' : 'Form deviation uitgezet.')
          }}
          variant={formDeviation ? 'danger' : 'secondary'}
        >
          <Camera className="size-4" />
          Knee valgus toggle
        </LabActionButton>
        <LabActionButton onClick={reset} variant="secondary">
          <RotateCcw className="size-4" />
          Reset
        </LabActionButton>
      </div>

      <LabInfoCard title="TV frame preview">
        <div className="aspect-video overflow-hidden rounded-xl border border-line bg-ink p-4">
          <div className="relative grid h-full place-items-center overflow-hidden rounded-lg bg-surface-2">
            <div className="absolute left-4 top-4 flex gap-2">
              <HudPill label="HR" value={`${heartRate}`} warn={fatigueWarning} />
              <HudPill label="REPS" value={`${reps}`} />
              <HudPill label="VLOSS" value={`${velocityLoss}%`} warn={velocityLoss > 35} />
            </div>
            <div className={cn('h-28 w-16 rounded-full border-2', formDeviation ? 'border-danger' : 'border-solo-400')} />
            <div className={cn('absolute bottom-5 rounded-full px-4 py-2 text-xs font-semibold', formDeviation ? 'bg-danger/20 text-danger' : 'bg-solo-400/10 text-solo-300')}>
              {formDeviation ? 'Knee valgus detected · cue naar TV' : 'Stable pastel-blue skeleton'}
            </div>
          </div>
        </div>
      </LabInfoCard>

      <ol className="flex flex-col gap-3">
        <PipelineStage step="A" title="Athlete starts set on Garmin Watch" description="Startsignaal komt vanaf de watch, zodat de telefoon niet hoeft te worden aangeraakt." status={stepStatuses.watch} />
        <PipelineStage step="B" title="Connect IQ opens BLE channel" description="Companion app exposeert een BLE-kanaal voor reps, velocity loss en HR." status={stepStatuses.ble} />
        <PipelineStage step="C" title="Browser receives telemetry" description="Web Bluetooth of companion SDK streamed de data naar React state/workers." status={stepStatuses.browser} />
        <PipelineStage step="D/E" title="Phone splits local processing" description="Pose engine en telemetry parser draaien naast elkaar op het device." status={stepStatuses.pose} />
        <PipelineStage step="F/J" title="React Canvas renders 16:9 HUD" description="Studio loop, skeleton overlay en oversized Garmin counters komen samen in één frame." status={stepStatuses.canvas} />
        <PipelineStage step="G/H/I" title="Form deviation branch" description="Afwijkingen kleuren de skeleton cue rood; anders blijft het stabiele pastel-blauw." status={stepStatuses.deviation} />
        <PipelineStage step="K" title="MediaStream to TV" description="canvas.captureStream levert 30 FPS frames aan AirPlay/Chromecast-ready output." status={stepStatuses.stream} />
      </ol>

      <LabInfoCard title="Beslispunten">
        <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-muted">
          <li>Garmin-reps en velocity loss vragen waarschijnlijk een Connect IQ companion, niet alleen standaard GATT.</li>
          <li>Pose en canvas moeten budget delen; doel is 30 FPS output zonder UI-jank.</li>
          <li>De TV krijgt alleen het gecomposeerde frame, niet de ruwe camera- of health-data.</li>
        </ul>
      </LabInfoCard>
    </LabShell>
  )
}

function HudPill({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={cn('rounded-lg border px-3 py-2', warn ? 'border-warn/40 bg-warn/10 text-warn' : 'border-line bg-ink/80 text-fg')}>
      <p className="label-mono text-[9px] text-faint">{label}</p>
      <p className="font-mono text-lg font-bold leading-none">{value}</p>
    </div>
  )
}
