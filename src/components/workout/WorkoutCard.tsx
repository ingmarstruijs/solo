import { ChevronRight, Clock, Dumbbell, Pencil, Share2, Star, Trash2 } from 'lucide-react'
import type { WorkoutTemplate } from '@/types/workout'
import { ExerciseIcon } from '@/components/workout/ExerciseIcon'
import { getWorkoutStructure } from '@/lib/workout/workoutStructure'
import { cn } from '@/lib/cn'

type WorkoutCardProps = {
  workout: WorkoutTemplate
  selected?: boolean
  multiSelected?: boolean
  selectionMode?: boolean
  onOpen: (workout: WorkoutTemplate) => void
  onEdit?: (workout: WorkoutTemplate) => void
  onShare?: (workout: WorkoutTemplate) => void
  onDelete?: (id: string) => void
  onToggleMulti?: (id: string) => void
  onToggleFavorite: (id: string) => void
}

export function WorkoutCard({
  workout,
  selected,
  multiSelected,
  selectionMode,
  onOpen,
  onEdit,
  onShare,
  onDelete,
  onToggleMulti,
  onToggleFavorite,
}: WorkoutCardProps) {
  const preview = workout.exercises.slice(0, 4)

  return (
    <article
      className={cn(
        'rounded-card border bg-surface transition-colors',
        selected || multiSelected ? 'border-solo-400 bg-solo-400/5' : 'border-line',
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(workout)}
        className="flex w-full items-start gap-3 p-3 text-left active:bg-surface-2"
      >
        {selectionMode && onToggleMulti && (
          <input
            type="checkbox"
            checked={multiSelected}
            onChange={(e) => {
              e.stopPropagation()
              onToggleMulti(workout.id)
            }}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 size-4 shrink-0 accent-solo-400"
            aria-label={`Multi-select ${workout.name}`}
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold leading-tight">{workout.name}</p>
              {workout.description && (
                <p className="mt-0.5 line-clamp-1 text-xs text-muted">{workout.description}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {onEdit && !selectionMode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(workout)
                  }}
                  className="p-1 text-faint active:text-fg"
                  aria-label={`${workout.name} bewerken`}
                >
                  <Pencil className="size-4" />
                </button>
              )}
              {onShare && !selectionMode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onShare(workout)
                  }}
                  className="p-1 text-faint active:text-solo-400"
                  aria-label={`${workout.name} delen`}
                >
                  <Share2 className="size-4" />
                </button>
              )}
              {onDelete && !selectionMode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(workout.id)
                  }}
                  className="p-1 text-faint active:text-danger"
                  aria-label={`${workout.name} verwijderen`}
                >
                  <Trash2 className="size-4" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite(workout.id)
                }}
                className="p-1"
                aria-label={workout.favorite ? 'Verwijder uit favorieten' : 'Favoriet'}
              >
                <Star className={cn('size-4', workout.favorite ? 'fill-warn text-warn' : 'text-faint')} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {workout.estimatedMinutes} min
            </span>
            <span className="flex items-center gap-1">
              <Dumbbell className="size-3" />
              {workout.exercises.length}
            </span>
            {getWorkoutStructure(workout) === 'circuit' ? (
              <span className="label-mono text-faint">{workout.circuitRounds} rondes</span>
            ) : (
              <span className="label-mono text-faint">{workout.sets} sets</span>
            )}
          </div>

          <div className="flex gap-1.5">
            {preview.map((ex) => (
              <span
                key={ex.id}
                className="grid size-9 place-items-center rounded-lg bg-surface-2"
                title={ex.name}
              >
                <ExerciseIcon metric={ex.metric} kind={ex.kind} equipment={ex.equipment} icon={ex.icon} size={22} />
              </span>
            ))}
            {workout.exercises.length > 4 && (
              <span className="grid size-9 place-items-center rounded-lg bg-surface-2 text-[10px] text-faint">
                +{workout.exercises.length - 4}
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="mt-1 size-5 shrink-0 text-faint" />
      </button>
    </article>
  )
}
