import { useEffect, useState, type ReactNode } from 'react'
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
import { cn } from '@/lib/cn'

type WgerFilterBarProps = {
  filters: WgerSearchFilters
  onChange: (filters: WgerSearchFilters) => void
}

type FilterGroupProps<T extends { id: number }> = {
  label: string
  items: T[]
  selectedId?: number
  onSelect: (id: number | undefined) => void
  renderImage: (item: T) => ReactNode
  renderLabel: (item: T) => string
}

function FilterGroup<T extends { id: number }>({
  label,
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
          label="Alle"
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
  const [categories, setCategories] = useState<WgerExerciseCategory[]>([])
  const [equipment, setEquipment] = useState<WgerEquipment[]>([])
  const [muscles, setMuscles] = useState<WgerMuscle[]>([])

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

  return (
    <div className="flex flex-col gap-2.5 border-b border-line px-4 py-3">
      <FilterGroup
        label="Categorie"
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
        label="Materiaal"
        items={equipment}
        selectedId={filters.equipment}
        onSelect={(equipmentId) => patch({ equipment: equipmentId })}
        renderLabel={(item) => item.name.replace('none (bodyweight exercise)', 'Lichaam')}
        renderImage={(item) => (
          <EquipmentIcon category={equipmentFilterCategory(item)} size={28} />
        )}
      />
      <FilterGroup
        label="Spier"
        items={muscles}
        selectedId={filters.muscles}
        onSelect={(musclesId) => patch({ muscles: musclesId })}
        renderLabel={(item) => muscleFilterLabel(item)}
        renderImage={(item) => (
          <img src={item.image_url_main} alt="" className="size-8 object-contain" loading="lazy" />
        )}
      />
    </div>
  )
}
