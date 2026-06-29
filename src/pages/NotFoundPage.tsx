import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="font-mono text-5xl font-bold text-solo-400">404</p>
      <p className="text-muted">Deze pagina bestaat niet.</p>
      <Link
        to="/"
        className="rounded-xl bg-surface-2 px-4 py-2 text-sm font-medium text-fg transition-colors active:bg-surface-3"
      >
        Terug naar Home
      </Link>
    </section>
  )
}
