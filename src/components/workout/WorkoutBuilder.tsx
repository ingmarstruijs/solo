import { Plus } from 'lucide-react'
import { useRef, useState } from 'react'
import type { WorkoutExercise, WorkoutTemplate } from '@/types/workout'
import { createId } from '@/lib/storage/localStore'
import { recalcWorkoutDuration } from '@/lib/workout/overloadPlanner'
import { getWorkoutStructure, type WorkoutStructure } from '@/lib/workout/workoutStructure'
import { LabActionButton } from '@/components/lab/LabPrimitives'
import { cn } from '@/lib/cn'
import { ExerciseBlock } from './ExerciseBlock'

type WorkoutBuilderProps = {
  initial?: WorkoutTemplate
  onSave: (data: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
  onDelete?: () => void
}

export function WorkoutBuilder({ initial, onSave, onCancel, onDelete }: WorkoutBuilderProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [structure, setStructure] = useState<WorkoutStructure>(() =>
    initial ? getWorkoutStructure(initial) : 'strength',
  )
  const [sets, setSets] = useState(initial?.sets ?? 3)
  const [restBetweenSets, setRestBetweenSets] = useState(initial?.restBetweenSets ?? 60)
  const [circuitRounds, setCircuitRounds] = useState(initial?.circuitRounds ?? 3)
  const [restBetweenRounds, setRestBetweenRounds] = useState(initial?.restBetweenRounds ?? 60)
  const [exercises, setExercises] = useState<WorkoutExercise[]>(
    initial?.exercises ?? [emptyExercise()],
  )
  const [nameError, setNameError] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  function updateExercise(idx: number, ex: WorkoutExercise) {
    setExercises((prev) => prev.map((e, i) => (i === idx ? ex : e)))
  }

  function removeExercise(idx: number) {
    setExercises((prev) => prev.filter((_, i) => i !== idx))
  }

  function addExercise() {
    setExercises((prev) => [...prev, emptyExercise()])
  }

  function reorderExercise(from: number, to: number) {
    if (from === to || from < 0 || from >= exercises.length || to < 0 || to >= exercises.length) return
    setExercises((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  function moveExercise(index: number, direction: -1 | 1) {
    reorderExercise(index, index + direction)
  }

  function handleSave() {
    if (!name.trim()) {
      setNameError(true)
      nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      nameInputRef.current?.focus({ preventScroll: true })
      return
    }
    setNameError(false)

    if (structure === 'strength') {
      onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        exercises,
        sets,
        restBetweenSets,
        favorite: initial?.favorite ?? false,
        source: initial?.source ?? 'manual',
        estimatedMinutes: recalcWorkoutDuration(exercises, sets, 1, 0),
        tags: initial?.tags ?? [],
      })
      return
    }

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      exercises,
      sets: 1,
      restBetweenSets: 0,
      circuitRounds,
      restBetweenRounds,
      favorite: initial?.favorite ?? false,
      source: initial?.source ?? 'manual',
      estimatedMinutes: recalcWorkoutDuration(exercises, 1, circuitRounds, restBetweenRounds),
      tags: initial?.tags ?? [],
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="label-mono text-faint">Workout naam</span>
        <input
          ref={nameInputRef}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (nameError && e.target.value.trim()) setNameError(false)
          }}
          placeholder="Bijv. Upper Push of Hyrox Circuit"
          className={cn(inputClass, nameError && 'border-danger focus:border-danger')}
          required
        />
        {nameError && <span className="text-xs text-danger">Naam is verplicht</span>}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="label-mono text-faint">Beschrijving</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={inputClass}
          placeholder="Optioneel"
        />
      </label>

      <div className="rounded-card border border-line bg-surface-2 p-3">
        <p className="text-sm font-semibold">Workout type</p>
        <p className="mt-0.5 text-xs text-muted">Kies hoe je door de oefeningen gaat.</p>
        <div className="mt-3 flex gap-2">
          {(
            [
              { id: 'strength' as const, label: 'Kracht', hint: 'Sets per oefening' },
              { id: 'circuit' as const, label: 'Circuit', hint: 'Rondes over workout' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setStructure(opt.id)}
              className={cn(
                'flex flex-1 flex-col rounded-xl border px-3 py-2.5 text-left transition-colors',
                structure === opt.id
                  ? 'border-solo-400/50 bg-solo-400/10'
                  : 'border-line active:bg-surface',
              )}
            >
              <span className="text-sm font-semibold">{opt.label}</span>
              <span className="text-[10px] text-muted">{opt.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {structure === 'strength' ? (
        <div className="rounded-card border border-line bg-surface-2 p-3">
          <p className="text-sm font-semibold">Sets & rust</p>
          <p className="mt-0.5 text-xs text-muted">
            Doe alle sets van één oefening achter elkaar, dan pas door naar de volgende.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="label-mono text-[9px] text-faint">Sets</span>
              <input
                type="number"
                min={1}
                value={sets}
                onChange={(e) => setSets(parseInt(e.target.value) || 1)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="label-mono text-[9px] text-faint">Rust tussen sets (s)</span>
              <input
                type="number"
                min={0}
                value={restBetweenSets}
                onChange={(e) => setRestBetweenSets(parseInt(e.target.value) || 0)}
                className={inputClass}
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="rounded-card border border-line bg-surface-2 p-3">
          <p className="text-sm font-semibold">Rondes & rust</p>
          <p className="mt-0.5 text-xs text-muted">
            Doe alle oefeningen één keer na elkaar en herhaal die hele ronde.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="label-mono text-[9px] text-faint">Rondes</span>
              <input
                type="number"
                min={2}
                value={circuitRounds}
                onChange={(e) => setCircuitRounds(Math.max(2, parseInt(e.target.value) || 2))}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="label-mono text-[9px] text-faint">Rust tussen rondes (s)</span>
              <input
                type="number"
                min={0}
                value={restBetweenRounds}
                onChange={(e) => setRestBetweenRounds(parseInt(e.target.value) || 0)}
                className={inputClass}
              />
            </label>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold">Oefeningen</p>
          {exercises.length > 1 && (
            <p className="mt-0.5 text-xs text-muted">Sleep ⋮⋮ of gebruik de pijlen om te sorteren.</p>
          )}
        </div>

        {exercises.map((ex, i) => (
          <ExerciseBlock
            key={ex.id}
            exercise={ex}
            index={i}
            canMoveUp={i > 0}
            canMoveDown={i < exercises.length - 1}
            onChange={(updated) => updateExercise(i, updated)}
            onRemove={() => removeExercise(i)}
            onMoveUp={() => moveExercise(i, -1)}
            onMoveDown={() => moveExercise(i, 1)}
            onReorder={reorderExercise}
          />
        ))}

        <button
          type="button"
          onClick={() => addExercise()}
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-line py-3 text-sm text-muted active:bg-surface-2"
        >
          <Plus className="size-4" />
          Oefening toevoegen
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {nameError && (
          <p className="text-center text-xs text-danger">
            Geef de workout eerst een naam om op te slaan.
          </p>
        )}
        <div className="flex gap-2">
          <LabActionButton variant="secondary" onClick={onCancel}>
            Annuleren
          </LabActionButton>
          <LabActionButton variant="primary" onClick={handleSave}>
            Opslaan
          </LabActionButton>
        </div>
        {onDelete && (
          <div className="mt-6 border-t border-line pt-4">
            <button
              type="button"
              onClick={onDelete}
              className="w-full rounded-xl border border-danger/25 px-4 py-2.5 text-sm font-medium text-danger active:bg-danger/10"
            >
              Workout verwijderen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function emptyExercise(): WorkoutExercise {
  return {
    id: createId(),
    name: '',
    kind: 'strength',
    metric: 'reps',
    target: 10,
    weightKg: 0,
    restSeconds: 60,
    equipment: [],
  }
}

const inputClass =
  'w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-fg outline-none focus:border-solo-400/50'
