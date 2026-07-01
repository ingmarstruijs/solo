import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { PageBackButton } from '@/components/layout/PageBackButton'
import { getWorkout } from '@/lib/storage/workoutStore'
import { useWorkouts } from '@/hooks/useWorkouts'
import { WorkoutBuilder } from '@/components/workout/WorkoutBuilder'

export function WorkoutEditorPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { add, update, remove } = useWorkouts()
  const isNew = location.pathname.endsWith('/new') || !id
  const existing = isNew ? undefined : getWorkout(id!)

  if (!isNew && !existing) {
    return (
      <div className="py-8 text-center text-muted">
        Workout niet gevonden.
        <button type="button" onClick={() => navigate('/workouts')} className="mt-4 block w-full text-solo-400">
          Terug
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 py-1">
      <div className="flex items-center gap-2">
        <PageBackButton to="/workouts" />
        <h1 className="min-w-0 flex-1 truncate text-base font-bold">
          {isNew ? 'Nieuwe workout' : 'Workout bewerken'}
        </h1>
      </div>

      <WorkoutBuilder
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
                if (!confirm(`"${existing!.name}" verwijderen?`)) return
                remove(id!)
                navigate('/workouts')
              }
        }
      />
    </div>
  )
}
