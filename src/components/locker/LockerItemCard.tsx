import { Pencil, Trash2 } from 'lucide-react'
import type { LockerItem } from '@/types/locker'
import { getEquipmentMeta } from '@/lib/locker/equipmentCatalog'
import { equipmentLabel } from '@/lib/locker/equipmentLabel'
import { EquipmentIcon } from './EquipmentIcon'

type LockerItemCardProps = {
  item: LockerItem
  onEdit: (item: LockerItem) => void
  onDelete: (id: string) => void
}

export function LockerItemCard({ item, onEdit, onDelete }: LockerItemCardProps) {
  const meta = getEquipmentMeta(item.category)

  return (
    <article className="flex items-center gap-3 rounded-card border border-line bg-surface p-3">
      <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-surface-2">
        <EquipmentIcon category={item.category} size={36} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{item.name}</p>
        <p className="text-xs text-muted">
          {equipmentLabel(meta.category)}
          {item.weightKg != null && ` · ${item.weightKg} kg`}
          {item.resistance && ` · ${item.resistance}`}
        </p>
        <p className="label-mono mt-0.5 text-faint">
          {item.brand || 'Geen merk'} · sinds {formatDate(item.firstUsedAt)}
        </p>
      </div>

      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="grid size-9 place-items-center rounded-lg text-muted active:bg-surface-2"
          aria-label="Bewerken"
        >
          <Pencil className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="grid size-9 place-items-center rounded-lg text-danger active:bg-danger/10"
          aria-label="Verwijderen"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </article>
  )
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}
