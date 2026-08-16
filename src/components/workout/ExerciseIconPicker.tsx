import type { EquipmentCategory } from '@/types/locker'
import { EQUIPMENT_CATALOG } from '@/lib/locker/equipmentCatalog'
import { equipmentLabel } from '@/lib/locker/equipmentLabel'
import { EquipmentIcon } from '@/components/locker/EquipmentIcon'
import { useTranslation } from '@/i18n/hooks'
import { cn } from '@/lib/cn'

type ExerciseIconPickerProps = {
  value?: EquipmentCategory
  onChange: (icon: EquipmentCategory | undefined) => void
}

export function ExerciseIconPicker({ value, onChange }: ExerciseIconPickerProps) {
  const { t } = useTranslation('workouts')

  return (
    <div className="mt-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="label-mono text-faint">{t('iconLabel')}</p>
        {value ? (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-[10px] text-solo-400 active:opacity-70"
          >
            {t('iconAuto')}
          </button>
        ) : (
          <span className="text-[10px] text-muted">{t('iconAuto')}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {EQUIPMENT_CATALOG.map((e) => (
          <button
            key={e.category}
            type="button"
            onClick={() => onChange(value === e.category ? undefined : e.category)}
            className={cn(
              'grid size-10 place-items-center rounded-lg border transition-colors',
              value === e.category
                ? 'border-solo-400/50 bg-solo-400/10'
                : 'border-line active:bg-surface-2',
            )}
            title={equipmentLabel(e.category)}
            aria-label={equipmentLabel(e.category)}
          >
            <EquipmentIcon category={e.category} size={22} />
          </button>
        ))}
      </div>
    </div>
  )
}
