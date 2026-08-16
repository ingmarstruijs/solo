import type { TvSensorState } from '@/lib/tv/broadcast'
import { Camera, Heart, Zap } from 'lucide-react'
import { useTranslation } from '@/i18n/hooks'
import { cn } from '@/lib/cn'

export function TvSensorStrip({ sensor }: { sensor: TvSensorState }) {
  const { t } = useTranslation('tv')

  return (
    <div className="grid grid-cols-3 gap-[1.5vh] rounded-[1.5vh] border border-line bg-surface p-[2vh]">
      <SensorTile
        icon={Camera}
        label={t('camera')}
        value={sensor.cameraEnabled ? t('live') : t('off')}
        active={sensor.cameraEnabled}
      />
      <SensorTile
        icon={Heart}
        label={sensor.heartRateLive && sensor.heartRateBpm != null ? t('hrBpm') : t('hrZone')}
        value={
          !sensor.garminConnected
            ? t('off')
            : sensor.heartRateLive && sensor.heartRateBpm != null
              ? `${sensor.heartRateBpm}`
              : `${sensor.heartRatePercentMax}%`
        }
        active={sensor.garminConnected}
        warn={sensor.garminConnected && sensor.heartRatePercentMax >= 85}
      />
      <SensorTile
        icon={Zap}
        label={t('velocityDrop')}
        value={sensor.garminConnected ? `-${sensor.velocityDropPercent}%` : t('off')}
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
