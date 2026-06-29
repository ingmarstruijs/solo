import { LogoMark } from '@/components/Logo'

/**
 * Passive 4K display surface. The phone is the controller; this page renders
 * the HUD and (later) live telemetry synced from the mobile session.
 * Intentionally rendered without the mobile shell.
 */
export function TvPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-ink p-[4vh] text-fg">
      <div className="flex flex-col items-center gap-[3vh] text-center">
        <LogoMark size={160} />
        <div className="flex flex-col gap-[1vh]">
          <h1 className="text-[6vh] font-bold leading-none tracking-tight">
            SOLO<span className="text-solo-400">.</span>
          </h1>
          <p className="label-mono text-[1.6vh] text-faint">Solo training. Zero noise.</p>
        </div>

        <div className="mt-[2vh] flex items-center gap-[1.5vh] rounded-full border border-line bg-surface px-[3vh] py-[1.5vh]">
          <span className="size-[1.4vh] animate-pulse rounded-full bg-solo-400" />
          <p className="text-[1.8vh] text-muted">Wacht op verbinding met je telefoon…</p>
        </div>
      </div>
    </div>
  )
}
