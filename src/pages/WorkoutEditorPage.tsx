import { useNavigate, useParams, useLocation } from 'react-router'
import { getWorkout } from '@/lib/storage/workoutStore'
import { useWorkouts } from '@/hooks/useWorkouts'
import { WorkoutBuilder } from '@/components/workout/WorkoutBuilder'
import { useTranslation } from '@/i18n/hooks'

export function WorkoutEditorPage() {
  const { t } = useTranslation('workouts')
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { add, update, remove } = useWorkouts()
  const isNew = location.pathname.endsWith('/new') || !id
  const existing = isNew ? undefined : getWorkout(id!)

  if (!isNew && !existing) {
    return (
      <div className="py-8 text-center text-muted">
        {t('notFound')}
        <button type="button" onClick={() => navigate('/workouts')} className="mt-4 block w-full text-solo-400">
          {t('back')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col py-1">
      <WorkoutBuilder
        title={isNew ? t('newTitle') : t('editTitle')}
        backTo="/workouts"
        initial={existing}
        onSave={(data) => {
          if (isNew) {
            add(data)
          } else {
            update(id!, data)
          }
          navigate('/workouts')
        }}
        onCancel={() => navigate('/workouts')}
        onDelete={
          isNew
            ? undefined
            : () => {
                if (!confirm(t('deleteNamedConfirm', { name: existing!.name }))) return
                remove(id!)
                navigate('/workouts')
              }
        }
      />
    </div>
  )
}
