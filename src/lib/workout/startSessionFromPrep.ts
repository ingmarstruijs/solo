import type { SessionPrep } from '@/lib/workout/sessionPrep'
import { activateSessionPrep } from '@/lib/workout/sessionPrep'
import { buildPrepTvState } from '@/lib/tv/broadcast'
import { publishToTvTransport } from '@/lib/tv/transport'
import type { ThemeId } from '@/lib/theme/themes'

export function startSessionFromPrep(prep: SessionPrep, theme: ThemeId) {
  activateSessionPrep(prep)
  publishToTvTransport(
    buildPrepTvState(
      prep.workouts.map((p) => p.workout),
      prep.recoveryScore,
      theme,
    ),
    { theme },
  )
}
