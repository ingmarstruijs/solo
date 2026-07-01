import { Check, ChevronRight, Clock, Dumbbell, Pencil, Share2, Star, Trash2 } from 'lucide-react'
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
  onToggleFavorite,
}: WorkoutCardProps) {
  const preview = workout.exercises.slice(0, 4)
  const isSelected = selected || multiSelected

  return (
    <article
      className={cn(
        'overflow-hidden rounded-card border bg-surface transition-colors',
        isSelected ? 'border-solo-400 bg-solo-400/5' : 'border-line',
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(workout)}
        className="flex w-full items-start gap-3 p-3 text-left active:bg-surface-2"
      >
        {selectionMode && (
          <span
            className={cn(
              'mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border-2 transition-colors',
              multiSelected
                ? 'border-solo-400 bg-solo-400 text-ink'
                : 'border-line bg-surface-2',
            )}
            aria-hidden
          >
            {multiSelected && <Check className="size-4" strokeWidth={3} />}
          </span>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="min-w-0">
            <p className="font-semibold leading-tight">{workout.name}</p>
            {workout.description && (
              <p className="mt-0.5 line-clamp-1 text-xs text-muted">{workout.description}</p>
            )}
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

        {!selectionMode && <ChevronRight className="mt-1 size-5 shrink-0 text-faint" />}
      </button>

      {!selectionMode && (
        <div className="grid grid-cols-4 border-t border-line">
          {onEdit && (
            <ActionButton label="Bewerken" onClick={() => onEdit(workout)}>
              <Pencil className="size-5" />
            </ActionButton>
          )}
          {onShare && (
            <ActionButton label="Delen" onClick={() => onShare(workout)} className="text-solo-400">
              <Share2 className="size-5" />
            </ActionButton>
          )}
          {onDelete && (
            <ActionButton label="Verwijderen" onClick={() => onDelete(workout.id)} className="text-danger">
              <Trash2 className="size-5" />
            </ActionButton>
          )}
          <ActionButton
            label={workout.favorite ? 'Favoriet' : 'Favoriet maken'}
            onClick={() => onToggleFavorite(workout.id)}
            className={workout.favorite ? 'text-warn' : undefined}
          >
            <Star className={cn('size-5', workout.favorite && 'fill-warn')} />
          </ActionButton>
        </div>
      )}
    </article>
  )
}

function ActionButton({
  children,
  label,
  onClick,
  className,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        'flex min-h-11 flex-col items-center justify-center gap-0.5 py-2 text-faint active:bg-surface-2',
        className,
      )}
      aria-label={label}
    >
      {children}
      <span className="text-[9px] font-medium">{label}</span>
    </button>
  )
}
