import { ScrollText, type LucideIcon } from 'lucide-react'
import { type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { logLevelColor, type LogEntry } from './useLabLog'

export function LabInfoCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon?: LucideIcon
  children: ReactNode
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        {Icon && <Icon className="size-4 text-solo-400" />}
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export function LabActionButton({
  children,
  onClick,
  disabled,
  variant = 'primary',
  className,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        variant === 'primary' && 'bg-solo-400 text-ink active:bg-solo-500',
        variant === 'secondary' && 'border border-line bg-surface-2 text-fg active:bg-surface-3',
        variant === 'danger' && 'border border-danger/40 bg-danger/10 text-danger active:bg-danger/20',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function LabTelemetryCard({
  icon: Icon,
  label,
  value,
  unit,
  live,
  warn,
}: {
  icon: LucideIcon
  label: string
  value: string
  unit: string
  live?: boolean
  warn?: boolean
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <Icon className={cn('size-5', warn ? 'text-warn' : 'text-solo-400')} />
        {live && (
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-success" />
            <span className="label-mono text-[10px] text-success">LIVE</span>
          </span>
        )}
      </div>
      <p className={cn('mt-3 text-3xl font-bold tabular-nums tracking-tight', warn && 'text-warn')}>
        {value}
      </p>
      <p className="text-xs text-muted">
        {label} · {unit}
      </p>
    </div>
  )
}

export function LabStatusPanel({
  title,
  ok,
  checks,
}: {
  title: string
  ok: boolean
  checks: { label: string; ok: boolean; hint: string }[]
}) {
  return (
    <div
      className={cn(
        'rounded-card border p-4',
        ok ? 'border-success/30 bg-success/5' : 'border-warn/30 bg-warn/5',
      )}
    >
      <p className="mb-3 text-sm font-semibold">{title}</p>
      <ul className="flex flex-col gap-2">
        {checks.map(({ label, ok: checkOk, hint }) => (
          <li key={label} className="flex items-center justify-between text-sm">
            <span className="text-muted">{label}</span>
            <span className={cn('font-mono text-xs', checkOk ? 'text-success' : 'text-warn')}>
              {hint}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function LabLogPanel({
  logs,
  emptyMessage = 'Nog geen events.',
}: {
  logs: LogEntry[]
  emptyMessage?: string
}) {
  return (
    <LabInfoCard title="Event log" icon={ScrollText}>
      {logs.length === 0 ? (
        <p className="text-sm text-faint">{emptyMessage}</p>
      ) : (
        <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
          {logs.map((entry) => (
            <li key={entry.id} className="font-mono text-[11px] leading-relaxed">
              <span className="text-faint">{entry.time}</span>{' '}
              <span className={logLevelColor(entry.level)}>[{entry.level}]</span>{' '}
              <span className="text-muted">{entry.message}</span>
            </li>
          ))}
        </ul>
      )}
    </LabInfoCard>
  )
}

export type PipelineStageStatus = 'idle' | 'pending' | 'active' | 'ok' | 'warn' | 'error'

const stageStatusStyles: Record<PipelineStageStatus, string> = {
  idle: 'border-line bg-surface text-faint',
  pending: 'border-line bg-surface-2 text-muted',
  active: 'border-solo-400/50 bg-solo-400/10 text-solo-300',
  ok: 'border-success/40 bg-success/10 text-success',
  warn: 'border-warn/40 bg-warn/10 text-warn',
  error: 'border-danger/40 bg-danger/10 text-danger',
}

export function PipelineStage({
  step,
  title,
  description,
  status,
  children,
}: {
  step: string
  title: string
  description: string
  status: PipelineStageStatus
  children?: ReactNode
}) {
  return (
    <li className="relative flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'grid size-8 shrink-0 place-items-center rounded-lg border font-mono text-xs font-bold',
            stageStatusStyles[status],
          )}
        >
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p>
        </div>
      </div>
      {children}
    </li>
  )
}
