import type { EquipmentCategory } from '@/types/locker'
import type { ExerciseMedia, SetMetric, WorkoutExercise } from '@/types/workout'

export type ExerciseVisualKind =
  | 'barbell'
  | 'dumbbell'
  | 'kettlebell'
  | 'cardio'
  | 'mobility'
  | 'bodyweight'
  | 'bands'

export type ExerciseVisual = {
  kind: ExerciseVisualKind
  title: string
  subtitle: string
  gradient: string
  loopClass: string
  media?: ExerciseMedia
  /** Best URL for TV display: medium thumbnail, then full image. */
  displayImageUrl?: string
}

type ResolveInput = Pick<
  WorkoutExercise,
  'name' | 'kind' | 'metric' | 'equipment' | 'icon' | 'media'
>

export function resolveExerciseVisual(exercise: ResolveInput): ExerciseVisual {
  const kind = inferVisualKind(exercise)
  const equipment = exercise.equipment.filter((c) => c !== 'other')
  const displayImageUrl =
    exercise.media?.thumbnailUrl ?? exercise.media?.imageUrl ?? undefined

  return {
    kind,
    title: exercise.name,
    subtitle: equipment.length > 0 ? equipment.join(' · ') : kindLabel(kind),
    gradient: GRADIENTS[kind],
    loopClass: `tv-loop-${kind}`,
    media: exercise.media,
    displayImageUrl,
  }
}

function inferVisualKind(exercise: ResolveInput): ExerciseVisualKind {
  if (exercise.icon) return iconToVisual(exercise.icon)
  const eq = exercise.equipment.filter((c) => c !== 'other')
  if (eq.includes('barbell') || eq.includes('weight_plate')) return 'barbell'
  if (eq.includes('dumbbell')) return 'dumbbell'
  if (eq.includes('kettlebell') || eq.includes('medicine_ball')) return 'kettlebell'
  if (eq.includes('resistance_band') || eq.includes('cable')) return 'bands'
  if (eq.includes('bodyweight') || eq.length === 0) return 'bodyweight'
  if (exercise.metric === 'distance' || eq.includes('rower') || eq.includes('jump_rope')) {
    return 'cardio'
  }
  const resolved = exercise.kind ?? (exercise.metric === 'time' ? 'cardio' : 'strength')
  if (resolved === 'mobility' || eq.includes('foam_roller')) return 'mobility'
  if (resolved === 'cardio' || exercise.metric !== 'reps') return 'cardio'
  return 'bodyweight'
}

function iconToVisual(icon: EquipmentCategory): ExerciseVisualKind {
  if (icon === 'bodyweight') return 'bodyweight'
  if (icon === 'barbell' || icon === 'weight_plate') return 'barbell'
  if (icon === 'dumbbell') return 'dumbbell'
  if (icon === 'kettlebell' || icon === 'medicine_ball') return 'kettlebell'
  if (icon === 'resistance_band' || icon === 'cable') return 'bands'
  if (icon === 'rower' || icon === 'jump_rope') return 'cardio'
  if (icon === 'foam_roller') return 'mobility'
  return 'bodyweight'
}

function kindLabel(kind: ExerciseVisualKind): string {
  const labels: Record<ExerciseVisualKind, string> = {
    barbell: 'Barbell',
    dumbbell: 'Dumbbell',
    kettlebell: 'Kettlebell',
    cardio: 'Cardio',
    mobility: 'Mobility',
    bodyweight: 'Bodyweight',
    bands: 'Bands',
  }
  return labels[kind]
}

const GRADIENTS: Record<ExerciseVisualKind, string> = {
  barbell:
    'radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--color-solo-400) 35%, transparent), transparent 55%), linear-gradient(135deg, var(--color-surface-2), var(--color-ink))',
  dumbbell:
    'radial-gradient(circle at 70% 30%, color-mix(in srgb, var(--color-calm) 28%, transparent), transparent 50%), linear-gradient(135deg, var(--color-surface-3), var(--color-surface))',
  kettlebell:
    'radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--color-calm) 32%, transparent), transparent 55%), linear-gradient(135deg, var(--color-surface-2), var(--color-ink))',
  cardio:
    'radial-gradient(circle at 40% 60%, color-mix(in srgb, var(--color-danger) 26%, transparent), transparent 50%), linear-gradient(135deg, var(--color-surface-3), var(--color-surface))',
  mobility:
    'radial-gradient(circle at 60% 30%, color-mix(in srgb, var(--color-accent) 32%, transparent), transparent 55%), linear-gradient(135deg, var(--color-surface-2), var(--color-ink))',
  bodyweight:
    'radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--color-solo-400) 22%, transparent), transparent 60%), linear-gradient(135deg, var(--color-surface), var(--color-ink))',
  bands:
    'radial-gradient(circle at 20% 80%, color-mix(in srgb, var(--color-success) 28%, transparent), transparent 50%), linear-gradient(135deg, var(--color-surface-2), var(--color-ink))',
}

export function metricLabel(metric: SetMetric, target: number): string {
  if (metric === 'reps') return `${target} reps`
  if (metric === 'time') return `${target}s`
  return `${target}m`
}
