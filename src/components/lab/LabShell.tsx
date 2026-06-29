import { ChevronLeft, type LucideIcon } from 'lucide-react'
import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'

type LabShellProps = {
  pillar: string
  title: string
  description: string
  icon: LucideIcon
  backTo?: string
  children: ReactNode
}

export function LabShell({
  pillar,
  title,
  description,
  icon: Icon,
  backTo = '/lab',
  children,
}: LabShellProps) {
  return (
    <section className="flex flex-col gap-5 py-2">
      <Link
        to={backTo}
        className="flex w-fit items-center gap-1 text-sm text-muted transition-colors active:text-fg"
      >
        <ChevronLeft className="size-4" />
        Labs
      </Link>

      <header className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-solo-400">
          <Icon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="label-mono text-faint">{pillar}</p>
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
        </div>
      </header>

      {children}
    </section>
  )
}
