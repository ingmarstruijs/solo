import type { SessionPrep } from '@/lib/workout/sessionPrep'
import { activateSessionPrep } from '@/lib/workout/sessionPrep'
import { buildSetupTvState } from '@/lib/tv/broadcast'
import { publishToTvTransport } from '@/lib/tv/transport'
import { collectWorkoutMaterials } from '@/lib/workout/sessionMaterials'
import type { ThemeId } from '@/lib/theme/themes'

export function startSessionFromPrep(prep: SessionPrep, theme: ThemeId) {
  activateSessionPrep(prep)
  const primary = prep.workouts[0]
  const materials = collectWorkoutMaterials(primary.workout, primary.targets)
  publishToTvTransport(
    buildSetupTvState(primary.workout, materials, prep.recoveryScore, theme),
    { theme },
  )
}
