import type { TvSensorState } from '@/lib/tv/broadcast'
import { Camera, Heart, Zap } from 'lucide-react'
import { cn } from '@/lib/cn'

export function TvSensorStrip({ sensor }: { sensor: TvSensorState }) {
  return (
    <div className="grid grid-cols-3 gap-[1.5vh] rounded-[1.5vh] border border-line bg-surface p-[2vh]">
      <SensorTile
        icon={Camera}
        label="Camera"
        value={sensor.cameraEnabled ? 'LIVE' : 'OFF'}
        active={sensor.cameraEnabled}
      />
      <SensorTile
        icon={Heart}
        label="HR zone"
        value={sensor.garminConnected ? `${sensor.heartRatePercentMax}%` : 'OFF'}
        active={sensor.garminConnected}
        warn={sensor.garminConnected && sensor.heartRatePercentMax >= 85}
      />
      <SensorTile
        icon={Zap}
        label="Velocity drop"
        value={sensor.garminConnected ? `-${sensor.velocityDropPercent}%` : 'OFF'}
        active={sensor.garminConnected}
        warn={sensor.garminConnected && sensor.velocityDropPercent > 35}
      />
    </div>
  )
}

function SensorTile({
  icon: Icon,
  label,
  value,
  active,
  warn,
}: {
  icon: typeof Camera
  label: string
  value: string
  active?: boolean
  warn?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-[0.5vh] text-center">
      <Icon
        className={cn(
          'size-[2.5vh]',
          active && 'text-success',
          warn && 'text-warn',
          !active && !warn && 'text-solo-400',
        )}
      />
      <p className="label-mono text-[1vh] text-faint">{label}</p>
      <p
        className={cn(
          'text-[2vh] font-bold tabular-nums',
          active && !warn && 'text-success',
          warn && 'text-warn',
          !active && !warn && 'text-muted',
        )}
      >
        {value}
      </p>
    </div>
  )
}
