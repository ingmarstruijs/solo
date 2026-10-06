import type { SessionPrep } from '@/lib/workout/sessionPrep'
import { activateSessionPrep } from '@/lib/workout/sessionPrep'

/** Activate prep as the live session. Theme arg kept for call-site compatibility. */
export function startSessionFromPrep(prep: SessionPrep, _theme?: unknown) {
  void _theme
  activateSessionPrep(prep)
}
