import { ChevronDown, ChevronUp, GripVertical, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { EquipmentCategory } from '@/types/locker'
import type { ExerciseKind, SetMetric, WorkoutExercise } from '@/types/workout'
import { EQUIPMENT_CATALOG } from '@/lib/locker/equipmentCatalog'
import { ExerciseIcon } from '@/components/workout/ExerciseIcon'
import { ExerciseIconPicker } from '@/components/workout/ExerciseIconPicker'
import { cn } from '@/lib/cn'

type ExerciseBlockProps = {
  exercise: WorkoutExercise
  index: number
  canMoveUp: boolean
  canMoveDown: boolean
  onChange: (exercise: WorkoutExercise) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onReorder: (fromIndex: number, toIndex: number) => void
}

const DRAG_MIME = 'application/x-solo-exercise-index'

const METRIC_HINTS: Record<SetMetric, string> = {
  reps: 'Aantal herhalingen per set',
  time: 'Duur in seconden per set',
  distance: 'Afstand in meters (hardlopen / Hyrox)',
}

export function ExerciseBlock({
  exercise,
  index,
  canMoveUp,
  canMoveDown,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onReorder,
}: ExerciseBlockProps) {
  const [dragOver, setDragOver] = useState(false)
  function patch(partial: Partial<WorkoutExercise>) {
    const next = { ...exercise, ...partial }
    if (partial.metric) next.kind = inferKind(partial.metric)
    onChange(next)
  }

  function toggleEquipment(cat: EquipmentCategory) {
    const has = exercise.equipment.includes(cat)
    patch({
      equipment: has
        ? exercise.equipment.filter((c) => c !== cat)
        : [...exercise.equipment, cat],
    })
  }

  const targetLabel =
    exercise.metric === 'reps' ? 'Reps' : exercise.metric === 'time' ? 'Tijd (s)' : 'Afstand (m)'

  return (
    <div
      className={cn(
        'rounded-card border bg-surface p-4 transition-colors',
        dragOver ? 'border-solo-400/50 bg-solo-400/5' : 'border-line',
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const from = Number(e.dataTransfer.getData(DRAG_MIME))
        if (!Number.isNaN(from)) onReorder(from, index)
      }}
    >
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData(DRAG_MIME, String(index))
            e.dataTransfer.effectAllowed = 'move'
          }}
          className="cursor-grab touch-none text-faint active:cursor-grabbing"
          aria-label="Sleep om te verplaatsen"
        >
          <GripVertical className="size-4" />
        </button>
        <div className="flex shrink-0 flex-col gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="grid size-5 place-items-center rounded text-faint disabled:opacity-25 active:bg-surface-2"
            aria-label="Omhoog"
          >
            <ChevronUp className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="grid size-5 place-items-center rounded text-faint disabled:opacity-25 active:bg-surface-2"
            aria-label="Omlaag"
          >
            <ChevronDown className="size-3.5" />
          </button>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-2">
          <ExerciseIcon
            metric={exercise.metric}
            kind={exercise.kind}
            equipment={exercise.equipment}
            icon={exercise.icon}
            size={22}
          />
        </span>
        <input
          value={exercise.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="Oefening naam"
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
        />
        <button type="button" onClick={onRemove} className="text-danger active:opacity-70">
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="mb-2 flex gap-1.5">
        {(['strength', 'cardio', 'mobility'] as ExerciseKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => patch({ kind: k })}
            className={cn(
              'rounded-lg border px-2 py-1 text-[10px] capitalize',
              exercise.kind === k || (!exercise.kind && k === inferKind(exercise.metric))
                ? 'border-solo-400/50 bg-solo-400/10 text-solo-300'
                : 'border-line text-faint',
            )}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Field label="Type" hint={METRIC_HINTS[exercise.metric]}>
          <select
            value={exercise.metric}
            onChange={(e) => patch({ metric: e.target.value as SetMetric })}
            className={inputClass}
          >
            <option value="reps">Reps</option>
            <option value="time">Tijd</option>
            <option value="distance">Afstand</option>
          </select>
        </Field>
        <Field label={targetLabel} hint="Doel per set">
          <input
            type="number"
            min={1}
            value={exercise.target}
            onChange={(e) => patch({ target: parseInt(e.target.value) || 1 })}
            className={inputClass}
          />
        </Field>
        <Field label="Gewicht (kg)" hint="0 = bodyweight">
          <input
            type="number"
            step="0.5"
            min={0}
            value={exercise.weightKg}
            onChange={(e) => patch({ weightKg: parseFloat(e.target.value) || 0 })}
            className={inputClass}
            disabled={exercise.metric === 'distance'}
          />
        </Field>
        <Field label="Rust na oefening (s)" hint="Pauze voordat je naar de volgende oefening gaat">
          <input
            type="number"
            min={0}
            value={exercise.restSeconds}
            onChange={(e) => patch({ restSeconds: parseInt(e.target.value) || 0 })}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="mt-3">
        <p className="label-mono mb-1.5 text-faint">Materiaal</p>
        <div className="flex flex-wrap gap-1.5">
          {EQUIPMENT_CATALOG.filter((e) => e.category !== 'other').map((e) => (
            <button
              key={e.category}
              type="button"
              onClick={() => toggleEquipment(e.category)}
              className={cn(
                'rounded-lg border px-2 py-1 text-[10px]',
                exercise.equipment.includes(e.category)
                  ? 'border-solo-400/50 bg-solo-400/10 text-solo-300'
                  : 'border-line text-faint',
              )}
            >
              {e.labelNl}
            </button>
          ))}
        </div>
      </div>

      <ExerciseIconPicker value={exercise.icon} onChange={(icon) => patch({ icon })} />

      <div className="mt-3">
        <Field label="Uitleg" hint="Markdown ondersteund — zichtbaar op mobiel (popup) en op TV">
          <textarea
            value={exercise.description ?? ''}
            onChange={(e) => patch({ description: e.target.value.trim() || undefined })}
            placeholder="Instructies, tips of uitvoering…"
            rows={3}
            className={cn(inputClass, 'resize-y min-h-[4.5rem]')}
          />
        </Field>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="label-mono text-[9px] text-faint">{label}</span>
      {children}
      {hint && <span className="text-[9px] text-faint">{hint}</span>}
    </label>
  )
}

function inferKind(metric: SetMetric): ExerciseKind {
  if (metric === 'distance' || metric === 'time') return 'cardio'
  return 'strength'
}

const inputClass =
  'w-full rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-sm outline-none focus:border-solo-400/50'
