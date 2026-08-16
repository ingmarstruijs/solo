import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { WgerExerciseCategory, WgerEquipment, WgerMuscle } from '@/types/wger'
import {
  getExerciseCategories,
  getWgerEquipmentList,
  getWgerMuscles,
  type WgerSearchFilters,
} from '@/lib/wger/client'
import {
  categoryFilterImage,
  equipmentFilterCategory,
  muscleFilterLabel,
} from '@/lib/wger/filters'
import { EquipmentIcon } from '@/components/locker/EquipmentIcon'
import { useTranslation } from '@/i18n/hooks'
import { cn } from '@/lib/cn'

type WgerFilterBarProps = {
  filters: WgerSearchFilters
  onChange: (filters: WgerSearchFilters) => void
}

type FilterGroupProps<T extends { id: number }> = {
  label: string
  allLabel: string
  items: T[]
  selectedId?: number
  onSelect: (id: number | undefined) => void
  renderImage: (item: T) => ReactNode
  renderLabel: (item: T) => string
}

function FilterGroup<T extends { id: number }>({
  label,
  allLabel,
  items,
  selectedId,
  onSelect,
  renderImage,
  renderLabel,
}: FilterGroupProps<T>) {
  if (items.length === 0) return null

  return (
    <div>
      <p className="label-mono mb-1.5 text-[9px] text-faint">{label}</p>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        <FilterChip
          label={allLabel}
          selected={selectedId == null}
          onClick={() => onSelect(undefined)}
        />
        {items.map((item) => (
          <FilterChip
            key={item.id}
            label={renderLabel(item)}
            image={renderImage(item)}
            selected={selectedId === item.id}
            onClick={() => onSelect(selectedId === item.id ? undefined : item.id)}
          />
        ))}
      </div>
    </div>
  )
}

function FilterChip({
  label,
  image,
  selected,
  onClick,
}: {
  label: string
  image?: ReactNode
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex shrink-0 flex-col items-center gap-1 rounded-xl border px-2 py-1.5 transition-colors',
        selected
          ? 'border-solo-400/50 bg-solo-400/10 text-solo-300'
          : 'border-line bg-surface-2 text-muted active:bg-surface-3',
      )}
    >
      <span className="grid size-10 place-items-center overflow-hidden rounded-lg bg-surface-3">
        {image ?? <span className="text-[10px] text-faint">—</span>}
      </span>
      <span className="max-w-[4.5rem] truncate text-[10px] font-medium">{label}</span>
    </button>
  )
}

export function WgerFilterBar({ filters, onChange }: WgerFilterBarProps) {
  const { t } = useTranslation(['workouts', 'common', 'locker'])
  const [categories, setCategories] = useState<WgerExerciseCategory[]>([])
  const [equipment, setEquipment] = useState<WgerEquipment[]>([])
  const [muscles, setMuscles] = useState<WgerMuscle[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    void Promise.all([getExerciseCategories(), getWgerEquipmentList(), getWgerMuscles()])
      .then(([cats, eq, mus]) => {
        setCategories(cats)
        setEquipment(eq)
        setMuscles(mus.filter((m) => m.name_en || m.image_url_main))
      })
      .catch(() => {
        /* filters are optional — search still works */
      })
  }, [])

  function patch(partial: WgerSearchFilters) {
    onChange({ ...filters, ...partial })
  }

  function equipmentItemLabel(item: WgerEquipment): string {
    if (item.name === 'none (bodyweight exercise)') {
      return t('locker:equipment.bodyweight')
    }
    return item.name
  }

  const activeLabels = useMemo(() => {
    const labels: string[] = []
    const category = categories.find((c) => c.id === filters.category)
    if (category) labels.push(category.name)
    const eq = equipment.find((e) => e.id === filters.equipment)
    if (eq) {
      labels.push(
        eq.name === 'none (bodyweight exercise)'
          ? t('locker:equipment.bodyweight')
          : eq.name,
      )
    }
    const muscle = muscles.find((m) => m.id === filters.muscles)
    if (muscle) labels.push(muscleFilterLabel(muscle))
    return labels
  }, [categories, equipment, muscles, filters.category, filters.equipment, filters.muscles, t])

  const activeCount = activeLabels.length
  const equipmentLabel = t('equipmentLabel')
  const summary =
    activeCount === 0
      ? `${t('filters')} · ${equipmentLabel}`
      : activeLabels.join(' · ')

  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left active:bg-surface-2"
        aria-expanded={expanded}
      >
        <SlidersHorizontal className="size-3.5 shrink-0 text-solo-400" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">
            {t('filters')}
            {activeCount > 0 && (
              <span className="ml-1.5 rounded-md bg-solo-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-solo-300">
                {activeCount}
              </span>
            )}
          </p>
          <p className="truncate text-[11px] text-muted">{summary}</p>
        </div>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-faint transition-transform',
            expanded && 'rotate-180',
          )}
        />
      </button>

      {expanded && (
        <div className="flex flex-col gap-2.5 border-t border-line px-4 py-3">
          <FilterGroup
            label="Category"
            allLabel={t('common:none')}
            items={categories}
            selectedId={filters.category}
            onSelect={(category) => patch({ category })}
            renderLabel={(item) => item.name}
            renderImage={(item) => {
              const src = categoryFilterImage(item)
              return src ? (
                <img src={src} alt="" className="size-8 object-contain" loading="lazy" />
              ) : null
            }}
          />
          <FilterGroup
            label={equipmentLabel}
            allLabel={t('common:none')}
            items={equipment}
            selectedId={filters.equipment}
            onSelect={(equipmentId) => patch({ equipment: equipmentId })}
            renderLabel={equipmentItemLabel}
            renderImage={(item) => (
              <EquipmentIcon category={equipmentFilterCategory(item)} size={28} />
            )}
          />
          <FilterGroup
            label="Muscle"
            allLabel={t('common:none')}
            items={muscles}
            selectedId={filters.muscles}
            onSelect={(musclesId) => patch({ muscles: musclesId })}
            renderLabel={(item) => muscleFilterLabel(item)}
            renderImage={(item) => (
              <img
                src={item.image_url_main}
                alt=""
                className="size-8 object-contain"
                loading="lazy"
              />
            )}
          />
        </div>
      )}
    </div>
  )
}
