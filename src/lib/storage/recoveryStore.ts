import { readStore, subscribeStore, writeStore } from './localStore'

const KEY = 'solo-recovery-score'

/**
 * Manual recovery score (0–100), edited via the Home/Settings/Prep slider.
 * Apple Health / Health Connect ingestion remains a later integration.
 */
export function getRecoveryScore(): number {
  return readStore<number>(KEY, 78)
}

export function setRecoveryScore(score: number): void {
  writeStore(KEY, Math.max(0, Math.min(100, Math.round(score))))
}

export function subscribeRecovery(onChange: () => void): () => void {
  return subscribeStore(KEY, onChange)
}

export function isRecoveryCritical(score: number): boolean {
  return score < 50
}
