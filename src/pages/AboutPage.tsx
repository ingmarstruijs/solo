import { Logo } from '@/components/Logo'

export function AboutPage() {
  return (
    <section className="flex flex-col gap-5 py-2">
      <Logo size={36} />
      <p className="text-sm leading-relaxed text-muted">
        SOLO. is een 100% open-source, privacy-first Progressive Web App voor autonome thuistraining.
        Geen cloud, geen abonnementen — alleen jij, je iron, en zero noise.
      </p>
      <ul className="flex flex-col gap-2 text-sm">
        <li className="flex justify-between border-b border-line py-2">
          <span className="text-muted">Versie</span>
          <span className="font-mono">0.1.0</span>
        </li>
        <li className="flex justify-between border-b border-line py-2">
          <span className="text-muted">Licentie</span>
          <span className="font-mono">MIT</span>
        </li>
      </ul>
    </section>
  )
}
