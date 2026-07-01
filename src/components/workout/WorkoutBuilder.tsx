import { Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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
  const [exercises, setExercises] = useState<WorkoutExercise[]>(
    initial?.exercises ?? [emptyExercise()],
  )
  const [nameError, setNameError] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  function setStructureMode(next: WorkoutStructure) {
    setStructure(next)
    if (next === 'circuit') {
      setExercises((prev) => prev.map((ex) => ({ ...ex, restSeconds: 0 })))
    }
  }

  function updateExercise(idx: number, ex: WorkoutExercise) {
    setExercises((prev) => prev.map((e, i) => (i === idx ? ex : e)))
  }

  function removeExercise(idx: number) {
    setExercises((prev) => prev.filter((_, i) => i !== idx))
  }

  function addExercise() {
    setExercises((prev) => [
      ...prev,
      structure === 'circuit' ? { ...emptyExercise(), restSeconds: 0 } : emptyExercise(),
    ])
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

    const circuitExercises = exercises.map((ex) => ({ ...ex, restSeconds: 0 }))
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      exercises: circuitExercises,
      sets: 1,
      restBetweenSets: 0,
      circuitRounds,
      restBetweenRounds: 0,
      favorite: initial?.favorite ?? false,
      source: initial?.source ?? 'manual',
      estimatedMinutes: recalcWorkoutDuration(circuitExercises, 1, circuitRounds, 0),
      tags: initial?.tags ?? [],
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="label-mono text-[9px] text-faint">Workout naam</span>
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

      <label className="flex flex-col gap-1">
        <span className="label-mono text-[9px] text-faint">Beschrijving</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={inputClass}
          placeholder="Optioneel"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="label-mono text-[9px] text-faint">Type</span>
        <div className="flex gap-1.5">
          {(
            [
              { id: 'strength' as const, label: 'Kracht' },
              { id: 'circuit' as const, label: 'Circuit' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setStructureMode(opt.id)}
              className={cn(
                'flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors',
                structure === opt.id
                  ? 'border-solo-400/50 bg-solo-400/10 text-solo-300'
                  : 'border-line text-muted active:bg-surface-2',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {structure === 'strength' ? (
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Sets" value={sets} min={1} onChange={setSets} />
          <NumberField
            label="Rust tussen sets (s)"
            value={restBetweenSets}
            min={0}
            onChange={setRestBetweenSets}
          />
        </div>
      ) : (
        <NumberField label="Rondes" value={circuitRounds} min={2} onChange={setCircuitRounds} />
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Oefeningen</p>
        {exercises.map((ex, i) => (
          <ExerciseBlock
            key={ex.id}
            exercise={ex}
            index={i}
            canMoveUp={i > 0}
            canMoveDown={i < exercises.length - 1}
            circuitMode={structure === 'circuit'}
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
          <p className="text-center text-xs text-danger">Geef de workout eerst een naam om op te slaan.</p>
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
          <button
            type="button"
            onClick={onDelete}
            className="mt-2 w-full rounded-xl border border-danger/25 px-4 py-2.5 text-sm font-medium text-danger active:bg-danger/10"
          >
            Workout verwijderen
          </button>
        )}
      </div>
    </div>
  )
}

function NumberField({
  label,
  value,
  min,
  onChange,
}: {
  label: string
  value: number
  min?: number
  onChange: (value: number) => void
}) {
  const [text, setText] = useState(String(value))

  useEffect(() => {
    setText(String(value))
  }, [value])

  function commit(raw: string) {
    if (raw.trim() === '') {
      onChange(min ?? 0)
      setText(String(min ?? 0))
      return
    }
    const parsed = parseInt(raw, 10)
    if (Number.isNaN(parsed)) {
      setText(String(value))
      return
    }
    const next = min != null ? Math.max(min, parsed) : parsed
    onChange(next)
    setText(String(next))
  }

  return (
    <label className="flex flex-col gap-1">
      <span className="label-mono text-[9px] text-faint">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => commit(text)}
        className={inputClass}
      />
    </label>
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
  'w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-fg outline-none focus:border-solo-400/50'
