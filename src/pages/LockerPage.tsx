import { Boxes } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { LockerItem } from '@/types/locker'
import { useLocker } from '@/hooks/useLocker'
import { LockerItemCard } from '@/components/locker/LockerItemCard'
import { LockerItemForm } from '@/components/locker/LockerItemForm'
import { LockerProfileSwitcher } from '@/components/locker/LockerProfileSwitcher'
import { LockerToolbar } from '@/components/locker/LockerToolbar'
import { useTranslation } from '@/i18n/hooks'

type Modal = 'add' | 'edit' | null

export function LockerPage() {
  const { t } = useTranslation(['locker', 'common'])
  const { items, activeProfile, add, update, remove, exportData, importData } = useLocker()
  const [modal, setModal] = useState<Modal>(null)
  const [editing, setEditing] = useState<LockerItem | null>(null)

  function handleExport() {
    const data = exportData()
    const slug = activeProfile.name.toLowerCase().replace(/\s+/g, '-')
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `solo-locker-${slug}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleSave(data: Omit<LockerItem, 'id' | 'createdAt' | 'updatedAt'>) {
    if (editing) {
      update(editing.id, data)
    } else {
      add(data)
    }
    setModal(null)
    setEditing(null)
  }

  function openEdit(item: LockerItem) {
    setEditing(item)
    setModal('edit')
  }

  return (
    <div className="flex flex-col gap-5 py-2">
      <header className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-surface-2 text-solo-400">
          <Boxes className="size-6" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{t('locker:title')}</h1>
          <p className="text-xs text-muted">
            {activeProfile.name} · {t('locker:itemCount', { count: items.length })}
          </p>
        </div>
      </header>

      <LockerProfileSwitcher />

      <LockerToolbar
        onAdd={() => {
          setEditing(null)
          setModal('add')
        }}
        onExport={handleExport}
        onImport={importData}
      />

      {items.length === 0 ? (
        <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
          {t('locker:emptyNamed', { name: activeProfile.name })}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <LockerItemCard
                item={item}
                onEdit={openEdit}
                onDelete={(id) => {
                  if (confirm(t('locker:deleteItemConfirm'))) remove(id)
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {modal && (
        <ModalOverlay
          onClose={() => {
            setModal(null)
            setEditing(null)
          }}
          closeLabel={t('common:close')}
        >
          <h2 className="mb-4 text-lg font-bold">
            {modal === 'edit' ? t('locker:editItem') : t('locker:addMaterial')}
          </h2>
          <LockerItemForm
            initial={editing ?? undefined}
            onSave={handleSave}
            onCancel={() => {
              setModal(null)
              setEditing(null)
            }}
          />
        </ModalOverlay>
      )}
    </div>
  )
}

function ModalOverlay({
  children,
  onClose,
  closeLabel,
}: {
  children: ReactNode
  onClose: () => void
  closeLabel: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/80 sm:items-center">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label={closeLabel} />
      <div className="relative z-10 max-h-[85dvh] w-full max-w-screen-sm overflow-y-auto rounded-t-card border border-line bg-surface p-5 sm:rounded-card">
        {children}
      </div>
    </div>
  )
}
