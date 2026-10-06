import { useEffect, useRef } from 'react'
import { buildRestStartAnnouncement, restCountdownWord } from '@/lib/coach/coachEngine'
import { speakCoachLine, speakCoachTick } from '@/lib/coach/coachVoice'
import type { RestCountdown, RestTimer } from '@/hooks/useRestCountdown'

/** Announces rest start and counts down the last five seconds. */
export function useRestCoach(
  countdown: RestCountdown,
  timer: RestTimer | null,
  enabled: boolean,
): void {
  const restId = timer && countdown.active ? timer.id : null
  const startKeyRef = useRef('')
  const ticksRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    if (!enabled || !countdown.active || !restId || !timer) return

    if (startKeyRef.current !== restId) {
      startKeyRef.current = restId
      ticksRef.current = new Set()
      speakCoachLine(
        buildRestStartAnnouncement(countdown.total, countdown.kind, countdown.phaseLabel),
        `rest-start-${restId}`,
      )
    }
  }, [enabled, countdown.active, countdown.total, countdown.kind, countdown.phaseLabel, restId, timer])

  useEffect(() => {
    if (!enabled || !countdown.active || !restId) return

    const tick = countdown.remaining
    if (tick < 1 || tick > 5 || ticksRef.current.has(tick)) return

    ticksRef.current.add(tick)
    speakCoachTick(restCountdownWord(tick), `rest-tick-${restId}-${tick}`)
  }, [enabled, countdown.active, countdown.remaining, restId])

  useEffect(() => {
    if (countdown.active) return
    startKeyRef.current = ''
    ticksRef.current = new Set()
  }, [countdown.active])
}
