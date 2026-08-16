import { Globe } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import type { EquipmentCategory, LockerItem } from '@/types/locker'
import { EQUIPMENT_CATALOG } from '@/lib/locker/equipmentCatalog'
import { equipmentLabel } from '@/lib/locker/equipmentLabel'
import { parseSmartImport } from '@/lib/locker/smartImport'
import { LabActionButton } from '@/components/lab/LabPrimitives'
import { cn } from '@/lib/cn'

type LockerItemFormProps = {
  initial?: Partial<LockerItem>
  onSave: (data: Omit<LockerItem, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

export function LockerItemForm({ initial, onSave, onCancel }: LockerItemFormProps) {
  const isNew = !initial?.id
  const [name, setName] = useState(initial?.name ?? '')
  const [brand, setBrand] = useState(initial?.brand ?? '')
  const [category, setCategory] = useState<EquipmentCategory>(initial?.category ?? 'dumbbell')
  const [weightKg, setWeightKg] = useState(initial?.weightKg?.toString() ?? '')
  const [resistance, setResistance] = useState(initial?.resistance ?? '')
  const [firstUsedAt, setFirstUsedAt] = useState(
    initial?.firstUsedAt ?? new Date().toISOString().slice(0, 10),
  )
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [importUrl, setImportUrl] = useState('')
  const [importPaste, setImportPaste] = useState('')
  const [importConfidence, setImportConfidence] = useState<'high' | 'medium' | 'low' | null>(null)

  const meta = EQUIPMENT_CATALOG.find((e) => e.category === category)!

  function applySmartImport() {
    const draft = parseSmartImport(importPaste || importUrl, importUrl)
    setName(draft.name)
    setBrand(draft.brand)
    setCategory(draft.category)
    setWeightKg(draft.weightKg?.toString() ?? '')
    setImportConfidence(draft.confidence)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      brand: brand.trim(),
      category,
      weightKg: meta.hasWeight && weightKg ? parseFloat(weightKg) : undefined,
      resistance: meta.hasResistance && resistance ? resistance : undefined,
      firstUsedAt,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {isNew && (
        <div className="rounded-card border border-solo-400/30 bg-surface-2 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Globe className="size-4 text-solo-400" />
            <p className="text-sm font-semibold">Smart import</p>
          </div>
          <p className="mb-3 text-xs text-muted">
            Plak een product-URL of webshop-tekst. Velden hieronder worden automatisch ingevuld.
          </p>
          <div className="flex flex-col gap-2">
            <input
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://…"
              className={inputClass}
            />
            <textarea
              value={importPaste}
              onChange={(e) => setImportPaste(e.target.value)}
              placeholder="Of plak pagina-inhoud / producttitel…"
              rows={2}
              className={inputClass}
            />
            <LabActionButton
              variant="secondary"
              onClick={applySmartImport}
              disabled={!importUrl.trim() && !importPaste.trim()}
            >
              Analyseren
            </LabActionButton>
            {importConfidence && (
              <p className={cn('label-mono text-[10px]', confidenceColor(importConfidence))}>
                Velden ingevuld · betrouwbaarheid {importConfidence}
              </p>
            )}
          </div>
        </div>
      )}

      <Field label="Naam">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Bijv. Hex dumbbell 20 kg"
          className={inputClass}
          required
        />
      </Field>

      <Field label="Merk">
        <input
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="Bijv. Rogue"
          className={inputClass}
        />
      </Field>

      <Field label="Type">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
          className={inputClass}
        >
          {EQUIPMENT_CATALOG.map((e) => (
            <option key={e.category} value={e.category}>
              {equipmentLabel(e.category)}
            </option>
          ))}
        </select>
      </Field>

      {meta.hasWeight && (
        <Field label="Gewicht (kg)">
          <input
            type="number"
            step="0.5"
            min="0"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="20"
            className={inputClass}
          />
        </Field>
      )}

      {meta.hasResistance && (
        <Field label="Weerstand">
          <select value={resistance} onChange={(e) => setResistance(e.target.value)} className={inputClass}>
            <option value="">Kies…</option>
            <option value="light">Light</option>
            <option value="medium">Medium</option>
            <option value="heavy">Heavy</option>
            <option value="extra-heavy">Extra heavy</option>
          </select>
        </Field>
      )}

      <Field label="Eerste gebruik">
        <input
          type="date"
          value={firstUsedAt}
          onChange={(e) => setFirstUsedAt(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Notities">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={inputClass}
          placeholder="Optioneel"
        />
      </Field>

      <div className="flex gap-2">
        <LabActionButton variant="secondary" onClick={onCancel}>
          Annuleren
        </LabActionButton>
        <button
          type="submit"
          className="flex flex-1 items-center justify-center rounded-xl bg-solo-400 px-4 py-3 text-sm font-semibold text-ink active:bg-solo-500"
        >
          Opslaan
        </button>
      </div>
    </form>
  )
}

function confidenceColor(c: 'high' | 'medium' | 'low'): string {
  if (c === 'high') return 'text-success'
  if (c === 'medium') return 'text-warn'
  return 'text-danger'
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="label-mono text-faint">{label}</span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-fg outline-none focus:border-solo-400/50'
