import { Download, Plus, Upload } from 'lucide-react'
import { useRef } from 'react'
import { LabActionButton } from '@/components/lab/LabPrimitives'
import { useTranslation } from '@/i18n/hooks'

type LockerToolbarProps = {
  onAdd: () => void
  onExport: () => void
  onImport: (json: string) => number
}

export function LockerToolbar({ onAdd, onExport, onImport }: LockerToolbarProps) {
  const { t } = useTranslation('locker')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const count = onImport(reader.result as string)
      alert(t('importedAlert', { count }))
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="flex gap-2">
      <LabActionButton variant="primary" onClick={onAdd} className="gap-1.5">
        <Plus className="size-4" />
        {t('add')}
      </LabActionButton>
      <LabActionButton variant="secondary" onClick={onExport} className="gap-1.5">
        <Download className="size-4" />
        {t('export')}
      </LabActionButton>
      <LabActionButton variant="secondary" onClick={() => fileRef.current?.click()} className="gap-1.5">
        <Upload className="size-4" />
        {t('import')}
      </LabActionButton>
      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFile} />
    </div>
  )
}
