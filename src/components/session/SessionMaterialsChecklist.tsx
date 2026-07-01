import { EquipmentIcon } from '@/components/locker/EquipmentIcon'
import type { SessionMaterialLine } from '@/lib/workout/sessionMaterials'

type SessionMaterialsChecklistProps = {
  materials: SessionMaterialLine[]
}

export function SessionMaterialsChecklist({ materials }: SessionMaterialsChecklistProps) {
  if (materials.length === 0) {
    return <p className="mt-2 text-xs text-muted">Geen materiaal nodig — bodyweight workout.</p>
  }

  return (
    <div className="mt-3">
      <p className="label-mono text-[10px] text-faint">Leg klaar</p>
      <ul className="mt-1.5 flex flex-col gap-1.5">
        {materials.map((line) => (
          <li
            key={line.id}
            className="flex items-center gap-2.5 rounded-lg border border-line/60 bg-surface/50 px-2.5 py-2"
          >
            <EquipmentIcon category={line.category} size={22} />
            <span className="text-sm font-medium leading-tight">{line.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
