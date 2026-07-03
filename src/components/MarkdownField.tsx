import { Bold, Eye, Heading3, Italic, List, Pencil } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { MarkdownText } from '@/components/MarkdownText'
import { cn } from '@/lib/cn'

type MarkdownFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  id?: string
}

type Tab = 'edit' | 'preview'

export function MarkdownField({
  value,
  onChange,
  placeholder = 'Instructies, tips of uitvoering…',
  rows = 6,
  id,
}: MarkdownFieldProps) {
  const [tab, setTab] = useState<Tab>('edit')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function applyEdit(
    next: string,
    selectionStart: number,
    selectionEnd: number = selectionStart,
  ) {
    onChange(next)
    requestAnimationFrame(() => {
      const el = textareaRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(selectionStart, selectionEnd)
    })
  }

  function wrapSelection(before: string, after: string, fallback: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end) || fallback
    const next = value.slice(0, start) + before + selected + after + value.slice(end)
    const cursor = start + before.length + selected.length + after.length
    applyEdit(next, cursor, cursor)
  }

  function insertLinePrefix(prefix: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart)
    const cursor = start + prefix.length
    applyEdit(next, cursor, cursor)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1">
        <div className="flex rounded-lg border border-line p-0.5">
          {(
            [
              { id: 'edit' as const, label: 'Bewerken', icon: Pencil },
              { id: 'preview' as const, label: 'Voorbeeld', icon: Eye },
            ] as const
          ).map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              type="button"
              onClick={() => setTab(tabId)}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium',
                tab === tabId ? 'bg-solo-400/15 text-solo-300' : 'text-faint active:bg-surface-2',
              )}
            >
              <Icon className="size-3" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'edit' && (
          <div className="flex gap-0.5">
            <ToolbarButton
              label="Vet"
              onClick={() => wrapSelection('**', '**', 'vet')}
            >
              <Bold className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              label="Cursief"
              onClick={() => wrapSelection('*', '*', 'cursief')}
            >
              <Italic className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              label="Kop"
              onClick={() => insertLinePrefix('### ')}
            >
              <Heading3 className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              label="Lijst"
              onClick={() => insertLinePrefix('- ')}
            >
              <List className="size-3.5" />
            </ToolbarButton>
          </div>
        )}
      </div>

      {tab === 'edit' ? (
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={cn(
            'w-full resize-y rounded-lg border border-line bg-surface-2 px-2.5 py-2 font-mono text-sm leading-relaxed outline-none focus:border-solo-400/50',
            'min-h-[7rem] whitespace-pre-wrap',
          )}
        />
      ) : value.trim() ? (
        <div className="min-h-[7rem] rounded-lg border border-line bg-surface-2 px-3 py-2">
          <MarkdownText content={value} />
        </div>
      ) : (
        <p className="min-h-[7rem] rounded-lg border border-dashed border-line px-3 py-2 text-sm text-faint">
          {placeholder}
        </p>
      )}
    </div>
  )
}

function ToolbarButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-8 place-items-center rounded-lg border border-line text-muted active:bg-surface-2"
    >
      {children}
    </button>
  )
}
