/** Age-free % of max HR estimate for TV HUD (190 bpm ≈ 100%). */
export function bpmToPercentMax(bpm: number, maxBpm = 190): number {
  if (bpm <= 0) return 0
  return Math.min(100, Math.round((bpm / maxBpm) * 100))
}
