import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type PlaceholderProps = {
  icon: LucideIcon
  title: string
  description: string
  children?: ReactNode
}

/** Consistent empty-state scaffold for pages that are not yet built out. */
export function Placeholder({ icon: Icon, title, description, children }: PlaceholderProps) {
  return (
    <section className="flex flex-col gap-5 py-2">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-surface-2 text-solo-400">
          <Icon className="size-6" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          <p className="label-mono text-faint">Binnenkort</p>
        </div>
      </div>

      <p className="max-w-prose text-sm leading-relaxed text-muted">{description}</p>

      {children}
    </section>
  )
}
