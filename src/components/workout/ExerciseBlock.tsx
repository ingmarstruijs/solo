import { ChevronDown, ChevronUp, GripVertical, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { EquipmentCategory } from '@/types/locker'
import type { ExerciseKind, SetMetric, WorkoutExercise } from '@/types/workout'
import { EQUIPMENT_CATALOG } from '@/lib/locker/equipmentCatalog'
import { equipmentLabel } from '@/lib/locker/equipmentLabel'
import { ExerciseIcon } from '@/components/workout/ExerciseIcon'
import { EquipmentIcon } from '@/components/locker/EquipmentIcon'
import { MarkdownField } from '@/components/MarkdownField'
import { TouchNumberField } from '@/components/ui/TouchNumberField'
import { useTranslation } from '@/i18n/hooks'
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
  /** Scroll into view and focus the name field (e.g. after adding an empty exercise). */
  autoFocusName?: boolean
}

const DRAG_MIME = 'application/x-solo-exercise-index'

const KIND_KEYS: Record<ExerciseKind, 'kindStrength' | 'kindCardio' | 'kindMobility'> = {
  strength: 'kindStrength',
  cardio: 'kindCardio',
  mobility: 'kindMobility',
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
  autoFocusName = false,
}: ExerciseBlockProps) {
  const { t } = useTranslation(['workouts', 'common'])
  const [dragOver, setDragOver] = useState(false)
  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!autoFocusName) return
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    nameInputRef.current?.focus({ preventScroll: true })
  }, [autoFocusName])

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
    exercise.metric === 'reps'
      ? t('metricReps')
      : exercise.metric === 'time'
        ? t('metricTime')
        : t('metricDistance')

  return (
    <div
      ref={rootRef}
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
          aria-label="Reorder"
        >
          <GripVertical className="size-4" />
        </button>
        <div className="flex shrink-0 flex-col gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="grid size-6 place-items-center rounded text-faint disabled:opacity-25 active:bg-surface-2"
            aria-label="Move up"
          >
            <ChevronUp className="size-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="grid size-6 place-items-center rounded text-faint disabled:opacity-25 active:bg-surface-2"
            aria-label="Move down"
          >
            <ChevronDown className="size-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setIconPickerOpen(true)}
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-surface-2 active:bg-surface-3"
          aria-label={t('iconPick')}
          title={t('iconPick')}
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
          ref={nameInputRef}
          value={exercise.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder={t('exerciseNamePlaceholder')}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
        />
        <button
          type="button"
          onClick={onRemove}
          className="grid size-10 place-items-center text-danger active:opacity-70"
          aria-label={t('common:delete')}
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
              'rounded-lg border px-2.5 py-1.5 text-xs',
              exercise.kind === k || (!exercise.kind && k === inferKind(exercise.metric))
                ? 'border-solo-400/50 bg-solo-400/10 text-solo-300'
                : 'border-line text-faint',
            )}
          >
            {t(KIND_KEYS[k])}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Field label={t('typeLabel')}>
          <div className="flex overflow-hidden rounded-xl border border-line bg-surface-2">
            {(
              [
                { id: 'reps' as const, labelKey: 'metricReps' as const },
                { id: 'time' as const, labelKey: 'metricTime' as const },
                { id: 'distance' as const, labelKey: 'metricDistance' as const },
              ] as const
            ).map((opt, index, list) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => patch({ metric: opt.id })}
                className={cn(
                  'min-h-11 flex-1 px-1 text-sm font-semibold transition-colors',
                  exercise.metric === opt.id
                    ? 'bg-solo-400/10 text-solo-300'
                    : 'text-muted active:bg-surface-3',
                  index < list.length - 1 && 'border-r border-line',
                )}
              >
                {t(opt.labelKey)}
              </button>
            ))}
          </div>
        </Field>
        <NumberField
          label={targetLabel}
          hint={t('targetPerSet')}
          value={exercise.target}
          min={1}
          preset={exercise.metric === 'reps' ? 'reps' : exercise.metric === 'distance' ? 'distance' : 'rest'}
          onChange={(v) => patch({ target: v })}
        />
        <NumberField
          label={t('weightLabel')}
          hint={t('weightHint')}
          value={exercise.weightKg}
          min={0}
          preset="weight"
          disabled={exercise.metric === 'distance'}
          onChange={(v) => patch({ weightKg: v })}
        />
        {!circuitMode && (
          <NumberField
            label={t('restLabel')}
            hint={t('restHint')}
            value={exercise.restSeconds}
            min={0}
            preset="rest"
            onChange={(v) => patch({ restSeconds: v })}
          />
        )}
      </div>

      <div className="mt-3">
        <p className="label-mono mb-2 text-faint">{t('equipmentLabel')}</p>
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
              {equipmentLabel(e.category)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <Field label={t('instructionsLabel')} hint={t('instructionsHint')}>
          <MarkdownField
            value={exercise.description ?? ''}
            onChange={(description) =>
              patch({ description: description.trim() ? description : undefined })
            }
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
  const { t } = useTranslation(['workouts', 'common'])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('iconPick')}
    >
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label={t('common:close')} />
      <div className="relative z-10 w-full max-w-sm rounded-card border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">{t('iconPick')}</p>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-lg" aria-label={t('common:close')}>
            <X className="size-5" />
          </button>
        </div>
        <button
          type="button"
          onClick={onAuto}
          className="mb-3 w-full rounded-xl border border-line py-2 text-sm text-solo-400 active:bg-surface-2"
        >
          {t('iconAuto')}
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
              title={equipmentLabel(e.category)}
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
  preset,
  disabled,
  onChange,
}: {
  label: string
  hint?: string
  value: number
  min?: number
  preset?: import('@/components/ui/TouchNumberField').TouchNumberPreset
  disabled?: boolean
  onChange: (value: number) => void
}) {
  return (
    <TouchNumberField
      label={label}
      hint={hint}
      value={value}
      min={min}
      preset={preset}
      disabled={disabled}
      onChange={onChange}
    />
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
