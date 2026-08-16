import { bpmToPercentMax } from '@/lib/ble/heartRateMath'

/** Aligns with TV sensor strip warn threshold. */
export const STRAIN_HR_PERCENT = 85

/** Cooldown between spoken strain cues (ms). */
export const STRAIN_COACH_COOLDOWN_MS = 90_000

export function hrPercentFromBpm(bpm: number | null | undefined): number {
  if (bpm == null || bpm <= 0) return 0
  return bpmToPercentMax(bpm)
}

/** Live HR strain — velocity-based strain stays blocked until Connect IQ. */
export function isHrStrain(percentMax: number): boolean {
  return percentMax >= STRAIN_HR_PERCENT
}

export function isLiveHrStrain(bpm: number | null | undefined): boolean {
  return isHrStrain(hrPercentFromBpm(bpm))
}
