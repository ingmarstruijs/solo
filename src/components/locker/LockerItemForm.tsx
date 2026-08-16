import { Globe } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import type { EquipmentCategory, LockerItem } from '@/types/locker'
import { EQUIPMENT_CATALOG } from '@/lib/locker/equipmentCatalog'
import { equipmentLabel } from '@/lib/locker/equipmentLabel'
import { parseSmartImport } from '@/lib/locker/smartImport'
import { LabActionButton } from '@/components/lab/LabPrimitives'
import { useTranslation } from '@/i18n/hooks'
import { cn } from '@/lib/cn'

type LockerItemFormProps = {
  initial?: Partial<LockerItem>
  onSave: (data: Omit<LockerItem, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

export function LockerItemForm({ initial, onSave, onCancel }: LockerItemFormProps) {
  const { t } = useTranslation(['locker', 'common'])
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
            <p className="text-sm font-semibold">{t('locker:smartImport')}</p>
          </div>
          <p className="mb-3 text-xs text-muted">{t('locker:smartImportHint')}</p>
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
              placeholder={t('locker:pasteContent')}
              rows={2}
              className={inputClass}
            />
            <LabActionButton
              variant="secondary"
              onClick={applySmartImport}
              disabled={!importUrl.trim() && !importPaste.trim()}
            >
              {t('locker:analyze')}
            </LabActionButton>
            {importConfidence && (
              <p className={cn('label-mono text-[10px]', confidenceColor(importConfidence))}>
                {t('locker:fieldsFilled', { confidence: importConfidence })}
              </p>
            )}
          </div>
        </div>
      )}

      <Field label={t('locker:name')}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('locker:namePlaceholder')}
          className={inputClass}
          required
        />
      </Field>

      <Field label={t('locker:brand')}>
        <input
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder={t('locker:brandPlaceholder')}
          className={inputClass}
        />
      </Field>

      <Field label={t('locker:type')}>
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
        <Field label={t('locker:weightKg')}>
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
        <Field label={t('locker:resistance')}>
          <select value={resistance} onChange={(e) => setResistance(e.target.value)} className={inputClass}>
            <option value="">{t('locker:choose')}</option>
            <option value="light">{t('locker:resistanceLight')}</option>
            <option value="medium">{t('locker:resistanceMedium')}</option>
            <option value="heavy">{t('locker:resistanceHeavy')}</option>
            <option value="extra-heavy">{t('locker:resistanceExtraHeavy')}</option>
          </select>
        </Field>
      )}

      <Field label={t('locker:firstUsed')}>
        <input
          type="date"
          value={firstUsedAt}
          onChange={(e) => setFirstUsedAt(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label={t('locker:notes')}>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={inputClass}
          placeholder={t('locker:notesPlaceholder')}
        />
      </Field>

      <div className="flex gap-2">
        <LabActionButton variant="secondary" onClick={onCancel}>
          {t('common:cancel')}
        </LabActionButton>
        <button
          type="submit"
          className="flex flex-1 items-center justify-center rounded-xl bg-solo-400 px-4 py-3 text-sm font-semibold text-ink active:bg-solo-500"
        >
          {t('common:save')}
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
