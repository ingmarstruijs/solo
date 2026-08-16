import { ArrowLeft, Dumbbell, Play, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { importSharedWorkout } from '@/lib/storage/workoutStore'
import { readWorkoutShareFromLocation } from '@/lib/workout/shareLink'
import { structureSummary } from '@/lib/workout/workoutStructure'
import { ExerciseIcon } from '@/components/workout/ExerciseIcon'
import { LabActionButton } from '@/components/lab/LabPrimitives'
import { useTranslation } from '@/i18n/hooks'

export function WorkoutSharePage() {
  const { t } = useTranslation(['workouts', 'common'])
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const exportData = useMemo(
    () => readWorkoutShareFromLocation(params.toString()),
    [params],
  )

  if (!exportData) {
    return (
      <div className="flex flex-col gap-4 py-8 text-center">
        <p className="text-muted">{t('shareInvalid')}</p>
        <button type="button" onClick={() => navigate('/workouts')} className="text-solo-400">
          {t('common:workouts')}
        </button>
      </div>
    )
  }

  const workout = exportData.workouts[0]

  function handleImport(andPrep: boolean) {
    const imported = importSharedWorkout(workout)
    if (andPrep) {
      navigate(`/workouts/prep?ids=${imported.id}`)
    } else {
      navigate('/workouts')
    }
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      <button
        type="button"
        onClick={() => navigate('/workouts')}
        className="flex items-center gap-2 text-sm text-muted active:text-fg"
      >
        <ArrowLeft className="size-4" />
        {t('common:workouts')}
      </button>

      <header>
        <p className="label-mono text-faint">{t('sharedWorkout')}</p>
        <h1 className="text-xl font-bold">{workout.name}</h1>
        {workout.description && (
          <p className="mt-1 text-sm text-muted">{workout.description}</p>
        )}
        <p className="mt-2 text-xs text-muted">{structureSummary(workout)}</p>
      </header>

      <section className="rounded-card border border-line bg-surface p-4">
        <p className="label-mono mb-3 text-faint">{t('exercisesHeading')}</p>
        <ul className="flex flex-col gap-3">
          {workout.exercises.map((ex, i) => (
            <li key={`${ex.id}-${i}`} className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-2">
                <ExerciseIcon
                  metric={ex.metric}
                  kind={ex.kind}
                  equipment={ex.equipment}
                  icon={ex.icon}
                  size={22}
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{ex.name}</p>
                <p className="text-xs text-muted">
                  {ex.metric === 'reps' && `${ex.target} ${t('common:reps')}`}
                  {ex.metric === 'time' && `${ex.target}${t('common:secondsShort')}`}
                  {ex.metric === 'distance' && `${ex.target}${t('common:metersShort')}`}
                  {ex.weightKg > 0 && ` · ${ex.weightKg} ${t('common:kg')}`}
                </p>
              </div>
              <span className="label-mono text-faint">#{i + 1}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-2">
        <LabActionButton variant="primary" onClick={() => handleImport(true)} className="gap-2">
          <Play className="size-4 fill-ink" />
          {t('addAndStart')}
        </LabActionButton>
        <LabActionButton variant="secondary" onClick={() => handleImport(false)} className="gap-2">
          <Plus className="size-4" />
          {t('addOnly')}
        </LabActionButton>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-faint">
        <Dumbbell className="size-3" />
        {t('shareLocalNote')}
      </p>
    </div>
  )
}
