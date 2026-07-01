import { ChevronDown, ChevronUp, GripVertical, Trash2, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import type { EquipmentCategory } from '@/types/locker'
import type { ExerciseKind, SetMetric, WorkoutExercise } from '@/types/workout'
import { EQUIPMENT_CATALOG } from '@/lib/locker/equipmentCatalog'
import { ExerciseIcon } from '@/components/workout/ExerciseIcon'
import { EquipmentIcon } from '@/components/locker/EquipmentIcon'
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
  circuitMode?: boolean
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
  circuitMode = false,
}: ExerciseBlockProps) {
  const [dragOver, setDragOver] = useState(false)
  const [iconPickerOpen, setIconPickerOpen] = useState(false)

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
        'rounded-card border bg-surface p-3 transition-colors',
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
            className="grid size-6 place-items-center rounded text-faint disabled:opacity-25 active:bg-surface-2"
            aria-label="Omhoog"
          >
            <ChevronUp className="size-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="grid size-6 place-items-center rounded text-faint disabled:opacity-25 active:bg-surface-2"
            aria-label="Omlaag"
          >
            <ChevronDown className="size-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setIconPickerOpen(true)}
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-surface-2 active:bg-surface-3"
          aria-label="Icoon aanpassen"
          title="Icoon aanpassen"
        >
          <ExerciseIcon
            metric={exercise.metric}
            kind={exercise.kind}
            equipment={exercise.equipment}
            icon={exercise.icon}
            size={24}
          />
        </button>
        <input
          value={exercise.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="Oefening naam"
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
        />
        <button
          type="button"
          onClick={onRemove}
          className="grid size-10 place-items-center text-danger active:opacity-70"
          aria-label="Verwijderen"
        >
          <Trash2 className="size-5" />
        </button>
      </div>

      <div className="mb-2 flex gap-1.5">
        {(['strength', 'cardio', 'mobility'] as ExerciseKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => patch({ kind: k })}
            className={cn(
              'rounded-lg border px-2.5 py-1.5 text-xs capitalize',
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
        <NumberField
          label={targetLabel}
          hint="Doel per set"
          value={exercise.target}
          min={1}
          onChange={(v) => patch({ target: v })}
        />
        <NumberField
          label="Gewicht (kg)"
          hint="0 = lichaamsgewicht"
          value={exercise.weightKg}
          min={0}
          step={0.5}
          disabled={exercise.metric === 'distance'}
          onChange={(v) => patch({ weightKg: v })}
        />
        {!circuitMode && (
          <NumberField
            label="Rust na oefening (s)"
            hint="Pauze voor volgende oefening"
            value={exercise.restSeconds}
            min={0}
            onChange={(v) => patch({ restSeconds: v })}
          />
        )}
      </div>

      <div className="mt-3">
        <p className="label-mono mb-2 text-faint">Materiaal</p>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_CATALOG.filter((e) => e.category !== 'other').map((e) => (
            <button
              key={e.category}
              type="button"
              onClick={() => toggleEquipment(e.category)}
              className={cn(
                'rounded-xl border px-3 py-2 text-xs font-medium',
                exercise.equipment.includes(e.category)
                  ? 'border-solo-400/50 bg-solo-400/10 text-solo-300'
                  : 'border-line text-faint active:bg-surface-2',
              )}
            >
              {e.labelNl}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <Field label="Uitleg" hint="Markdown — zichtbaar in prep en sessie">
          <textarea
            value={exercise.description ?? ''}
            onChange={(e) => patch({ description: e.target.value.trim() || undefined })}
            placeholder="Instructies, tips of uitvoering…"
            rows={3}
            className={cn(inputClass, 'min-h-[4.5rem] resize-y')}
          />
        </Field>
      </div>

      {iconPickerOpen && (
        <IconPickerDialog
          value={exercise.icon}
          onSelect={(icon) => {
            patch({ icon })
            setIconPickerOpen(false)
          }}
          onAuto={() => {
            patch({ icon: undefined })
            setIconPickerOpen(false)
          }}
          onClose={() => setIconPickerOpen(false)}
        />
      )}
    </div>
  )
}

function IconPickerDialog({
  value,
  onSelect,
  onAuto,
  onClose,
}: {
  value?: EquipmentCategory
  onSelect: (icon: EquipmentCategory) => void
  onAuto: () => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Icoon kiezen"
    >
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Sluiten" />
      <div className="relative z-10 w-full max-w-sm rounded-card border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Icoon kiezen</p>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-lg">
            <X className="size-5" />
          </button>
        </div>
        <button
          type="button"
          onClick={onAuto}
          className="mb-3 w-full rounded-xl border border-line py-2 text-sm text-solo-400 active:bg-surface-2"
        >
          Automatisch (op basis van materiaal)
        </button>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_CATALOG.map((e) => (
            <button
              key={e.category}
              type="button"
              onClick={() => onSelect(e.category)}
              className={cn(
                'grid size-12 place-items-center rounded-xl border',
                value === e.category
                  ? 'border-solo-400/50 bg-solo-400/10'
                  : 'border-line active:bg-surface-2',
              )}
              title={e.labelNl}
            >
              <EquipmentIcon category={e.category} size={24} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function NumberField({
  label,
  hint,
  value,
  min,
  step,
  disabled,
  onChange,
}: {
  label: string
  hint?: string
  value: number
  min?: number
  step?: number
  disabled?: boolean
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
    const parsed = step != null && step < 1 ? parseFloat(raw) : parseInt(raw, 10)
    if (Number.isNaN(parsed)) {
      setText(String(value))
      return
    }
    const next = min != null ? Math.max(min, parsed) : parsed
    onChange(next)
    setText(String(next))
  }

  return (
    <Field label={label} hint={hint}>
      <input
        type="number"
        inputMode={step != null && step < 1 ? 'decimal' : 'numeric'}
        min={min}
        step={step}
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => commit(text)}
        className={inputClass}
      />
    </Field>
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
  'w-full rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-sm outline-none focus:border-solo-400/50'
